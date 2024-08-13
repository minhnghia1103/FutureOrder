import WebSocket from "ws";
import { OutgoingHttpHeaders } from "http";

interface KlineData {
    openTime: number;
    symbol: string;
    interval: string;
    open: number;
    close: number;
    high: number;
    low: number;
    closeTime: number;
}

interface PriceData {
    symbol: string;
    price: number;
    timestamp: number;
    amount: number;
}

interface OrderbookData {
    symbol: string;
    bids: { price: number; quantity: number }[];
    asks: { price: number; quantity: number }[];
}

class WebSocketClient {
    private urlSocket: string;
    private headers: Object;
    private socket: WebSocket | null = null;
    private reconnectInterval: number = 10000;
    private pingInterval: number = 30000;
    private pingTimeout: number = 5000;
    private pingIntervalId: any = null;
    private pingTimeoutId: any = null;
    private receivedPong: boolean = false;

    constructor(urlSocket: string, headers: Object) {
        this.urlSocket = urlSocket;
        this.headers = headers;
    }

    // start the connection
    public initConnection(): void {
        this.socket = new WebSocket(this.urlSocket, {
            headers: this.headers as OutgoingHttpHeaders
        });

        this.socket.on('open', this.onOpen.bind(this));
        this.socket.on('close', this.onClose.bind(this));
        this.socket.on('error', this.onError.bind(this));
        this.socket.on('message', this.onMessage.bind(this));
    }

    private onOpen(): void {
        console.log('Kết nối đến server');
        setTimeout(() => {
            this.startPingPong();
        }, 10000); // 10 seconds delay before starting ping-pong
    }

    private onClose(): void {
        console.log('Kết nối bị đóng');
        this.reconnectSocket();
    }

    private onError(error: Error): void {
        console.error('Lỗi socket:', error.message);
        this.socket?.terminate();
        this.reconnectSocket();
    }

    private onMessage(data: WebSocket.Data): void {
        this.handleMessage(data);
    }

    private reconnectSocket(): void {
        this.stopPingPong();
        console.log('Đang kết nối lại...');
        this.socket = null; // reset socket instance

        setTimeout(() => {
            this.initConnection();
        }, this.reconnectInterval);
    }

    private checkTimeout(): void {
        if (this.socket?.readyState === WebSocket.OPEN && !this.receivedPong) {
            this.socket.terminate();
        }
    }

    private startPingPong(): void {
        this.stopPingPong();
        this.pingIntervalId = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                const message = { method: 'PING' };
                this.socket?.send(JSON.stringify(message));
                this.pingTimeoutId = setTimeout(() => {
                    this.checkTimeout();
                }, this.pingTimeout);
                this.receivedPong = false;
            }
        }, this.pingInterval);
    }

    private stopPingPong(): void {
        clearInterval(this.pingIntervalId);
        clearTimeout(this.pingTimeoutId);
    }

    // Subscribe to channels once the connection is open
    private onOpenSubscribe(socket: WebSocket | null, subscribeCallback: () => void) {
        if (socket) {
            socket.on('open', subscribeCallback);
        }
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            const message = JSON.parse(data.toString());
            if (message.method === 'PONG') {
                this.receivedPong = true;
            } else if (message.c) {
                this.handleSubscriptionData(message);
            }
        } catch (error) {
            console.error('Lỗi khi phân tích tin nhắn:', error);
        }
    }

    private handleSubscriptionData(message: any): void {
            if (message.c.includes('spot@public.miniTicker')) {
                const priceData: PriceData = {
                    symbol: message.d.s,
                    price: parseFloat(message.d.p),
                    timestamp: parseInt(message.d.t),
                    amount: parseFloat(message.d.q)
                };
                console.log(priceData);
            }

            if (message.c.includes('spot@public.kline')) {
                const klineData: KlineData = {
                    openTime: parseInt(message.d.t) * 1000,
                    symbol: message.d.symbol,
                    interval: message.d.interval,
                    open: parseFloat(message.d.o),
                    close: parseFloat(message.d.c),
                    high: parseFloat(message.d.h),
                    low: parseFloat(message.d.l),
                    closeTime: parseInt(message.d.tdt)
                };
                console.log(klineData);
            }

            if (message.c.includes('spot@public.increase.aggre.depth')) {
                const orderbookData: OrderbookData = {
                    symbol: message.s,
                    bids: Array.isArray(message.d.bids)
                        ? message.d.bids.sort((a: any, b: any) => b.p - a.p).map((bid: any) => ({
                              price: bid.p,
                              quantity: bid.q
                          }))
                        : [],
                    asks: Array.isArray(message.d.asks)
                        ? message.d.asks.sort((a: any, b: any) => a.p - b.p).map((ask: any) => ({
                              price: ask.p,
                              quantity: ask.q
                          }))
                        : []
                };
                console.log(orderbookData);
            }
    }

    // Subscribe to price channels
    public subscribePriceChannels(symbols: Array<string>) {
        this.initConnection();
        this.onOpenSubscribe(this.socket, () => {
            const message = {
                method: 'SUBSCRIPTION',
                params: symbols.map(symbol => `spot@public.miniTicker@${symbol}@UTC+8`)
            };
            const parsedMessage = JSON.stringify(message);
            this.socket!.send(parsedMessage);
        });
    }

    // Subscribe to kline channels
    public subscribeKlineChannels(symbolConfigs: { symbol: string; interval: string }[]) {
        this.onOpenSubscribe(this.socket, () => {
            const message = {
                method: 'SUBSCRIPTION',
                params: symbolConfigs.map(symbolConfig => `spot@public.kline@${symbolConfig.symbol}@${symbolConfig.interval}`)
            };
            const parsedMessage = JSON.stringify(message);
            this.socket!.send(parsedMessage);
        });
    }

    // Subscribe to orderbook channels
    public subscribeOrderbookChannels(symbols: Array<string>) {
        this.onOpenSubscribe(this.socket, () => {
            const message = {
                method: 'SUBSCRIPTION',
                params: symbols.map(symbol => `spot@public.increase.aggre.depth@${symbol}`)
            };
            const parsedMessage = JSON.stringify(message);
            console.log(parsedMessage);
            this.socket!.send(parsedMessage);
        });
    }
}

const urlSocket = 'wss://wbs.kcex.com/ws?platform=web';
const headers = {
    'User-Agent': '*',
    'Accept': '*/*',
    'Connection': 'keep-alive'
};

const client = new WebSocketClient(urlSocket, headers);

client.initConnection();
// client.subscribePriceChannels(['BTC_USDT', 'ETH_USDT']);

const symbolConfigs = [
    { symbol: 'BTC_USDT', interval: 'Min15' },
    { symbol: 'ETH_USDT', interval: 'Min15' }
];
client.subscribeKlineChannels(symbolConfigs);

//client.subscribeOrderbookChannels(['BTC_USDT', 'ETH_USDT']);

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
    private reconnectInterval: number = 1000;
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
    public initConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.urlSocket, {
                headers: this.headers as OutgoingHttpHeaders
            });

            this.socket.on('open', () => {
                console.log('Kết nối đến server');
                this.startPingPong();
                resolve();
            });
            this.socket.on('close', () => {
                this.onClose();
            });
            this.socket.on('error', (error) => {
                this.onError(error);
                reject(error);
            });
            this.socket.on('message', (message) => {
                this.onMessage(message);
            });
        });
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
        console.log(this);
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
        this.pingTimeoutId = setTimeout(() => {
            if (this.socket?.readyState === WebSocket.OPEN && !this.receivedPong) {
                this.socket.terminate();
            }
        }, this.pingTimeout);
        this.receivedPong = false;  
    }

    private startPingPong(): void {
        this.stopPingPong();
        this.pingIntervalId = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                const message = { method: 'PING' };
                console.log(message);
                this.socket?.send(JSON.stringify(message));
                this.checkTimeout();
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

    private handleMessage(data: WebSocket.Data): any {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.msg === 'PONG') {
                console.log(message);
                return this.receivedPong = true;
            } 
            if (message.c) {
                return this.handleSubscriptionData(message);
            }
        } catch (error) {
            console.error('Lỗi khi phân tích tin nhắn:', error);
        }
    }

    private handleSubscriptionData(message: any): any {
        if (message.c.includes('spot@public.miniTicker')) {
            const data = message.d;
            const priceData: PriceData = {
                symbol: data.s,
                price: parseFloat(data.p),
                timestamp: parseInt(data.t),
                amount: parseFloat(data.q)
            };
            //console.log(priceData);
            return;
        }

        if (message.c.includes('spot@public.kline')) {
            const data = message.d;
            const klineData: KlineData = {
                openTime: parseInt(data.t) * 1000,
                symbol: data.symbol,
                interval: data.interval,
                open: parseFloat(data.o),
                close: parseFloat(data.c),
                high: parseFloat(data.h),
                low: parseFloat(data.l),
                closeTime: parseInt(data.tdt)
            };
            //console.log(klineData);
            return;
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
            //console.log(orderbookData);
            return;
        }
    }

    // Subscribe to price channels
    public subscribePriceChannels(symbols: Array<string>) {
        const message = {
            method: 'SUBSCRIPTION',
            params: symbols.map(symbol => `spot@public.miniTicker@${symbol}@UTC+8`)
        };
        const parsedMessage = JSON.stringify(message);
        this.socket!.send(parsedMessage);
    }

    // Subscribe to kline channels
    public subscribeKlineChannels(symbolConfigs: { symbol: string; interval: string }[]) {
        const message = {
            method: 'SUBSCRIPTION',
            params: symbolConfigs.map(symbolConfig => `spot@public.kline@${symbolConfig.symbol}@${symbolConfig.interval}`)
        };
        const parsedMessage = JSON.stringify(message);
        this.socket!.send(parsedMessage);
    }

    // Subscribe to orderbook channels
    public subscribeOrderbookChannels(symbols: Array<string>) {
        const message = {
            method: 'SUBSCRIPTION',
            params: symbols.map(symbol => `spot@public.increase.aggre.depth@${symbol}`)
        };
        const parsedMessage = JSON.stringify(message);
        console.log(parsedMessage);
        this.socket!.send(parsedMessage);
    }

}

const urlSocket = 'wss://wbs.kcex.com/ws?platform=web';
const headers = {
    'User-Agent': '*',
    'Accept': '*/*',
    'Connection': 'keep-alive'
};

const client = new WebSocketClient(urlSocket, headers);

const priceSymbols = ['BTC_USDT', 'ETH_USDT'];
const klineConfigs = [
    { symbol: 'BTC_USDT', interval: 'Min15' },
    { symbol: 'ETH_USDT', interval: 'Min15' }
];
const orderbookSymbols = ['BTC_USDT', 'ETH_USDT'];

// Sử dụng async/await để đảm bảo rằng các subscribe được thực hiện sau khi kết nối đã được mở
(async () => {
    await client.initConnection()
    .then(() => {
    // client.subscribePriceChannels(priceSymbols);
    // client.subscribeKlineChannels(klineConfigs);
    // client.subscribeOrderbookChannels(orderbookSymbols);
})
})();


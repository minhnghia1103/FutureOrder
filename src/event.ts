import WebSocket from "ws";
import {
    OutgoingHttpHeaders
} from "http";
import {
    EventEmitter
} from 'events';

interface KlineData {
    openTime: number;
    symbol: string;
    interval: string;
    open: string;
    close: string;
    high: string;
    low: string;
    closeTime: number;
}

interface PriceData {
    symbol: string;
    price: string;
    timestamp: number;
    amount: string;
}

interface OrderbookData {
    bids: {
        price: string;quantity: string
    } [];
    asks: {
        price: string;quantity: string
    } [];
}

class WebSocketClient extends EventEmitter {
    private urlSocket: string;
    private headers: OutgoingHttpHeaders;
    private socket: WebSocket | null = null;
    private reconnectInterval: number = 1000;
    private pingInterval: number = 5000;
    private pingTimeout: number = 1000;
    private pingIntervalId: any = null;
    private pingTimeoutId: any = null;
    private receivedPong: boolean = false;
    private orderBookStore: {
        [key: string]: any
    } = {};

    constructor(urlSocket: string, headers: OutgoingHttpHeaders) {
        super();
        this.urlSocket = urlSocket;
        this.headers = headers;
    }

    public initConnection(): void {
        this.socket = new WebSocket(this.urlSocket, {
            headers: this.headers
        });

        this.socket.on('open', () => {
            this.onOpen()
        });
        this.socket.on('close', () => {
            this.onClose()
        });
        this.socket.on('error', (error) => {
            this.onError(error)
        });
        this.socket.on('message', (data) => {
            this.onMessage(data)
        });
    }

    public subscribePriceChannels(symbols: Array < string > ) {
        const message = {
            method: 'SUBSCRIPTION',
            params: symbols.map(symbol => `spot@public.miniTicker@${symbol}@UTC+8`)
        };
        const parsedMessage = JSON.stringify(message);

        if (this.socket) {
            this.socket.send(parsedMessage);
        }
    }

    public subscribeKlineChannels(symbolConfigs: {
        symbol: string;interval: string
    } []) {
        const message = {
            method: 'SUBSCRIPTION',
            params: symbolConfigs.map(symbolConfig => `spot@public.kline@${symbolConfig.symbol}@${symbolConfig.interval}`)
        };
        const parsedMessage = JSON.stringify(message);
        if (this.socket) {
            this.socket.send(parsedMessage);
        }
    }

    public async subscribeOrderbookChannels(symbols: Array < string > ): void {
        const promises = symbols.map(symbol => this.getOrderBookStore(symbol));

        await Promise.all(promises);

        const message = {
            method: 'SUBSCRIPTION',
            params: symbols.map(symbol => `spot@public.increase.aggre.depth@${symbol}`)
        };
        const parsedMessage = JSON.stringify(message);

        if (this.socket) {
            this.socket.send(parsedMessage);
        }
    }

    private onOpen(): void {
        console.log('Kết nối đến server');
        this.emit('open');
        this.startPingPong();
    }

    private onClose(): void {
        console.log('Kết nối bị đóng');
        this.emit('close');
        this.reconnectSocket();
    }

    private onError(error: Error): void {
        console.error('Lỗi socket:', error.message);
        this.emit('error');
        this.reconnectSocket();
    }

    private onMessage(data: WebSocket.Data): void {
        const message = JSON.parse(data.toString());

        if (message.msg === 'PONG') {
            clearTimeout(this.pingTimeoutId);
            return;
        }

        if (!message.c) {
            return;
        }

        if (message.c.includes('spot@public.miniTicker')) {
            this.handleChanelMiniTicker(message);
            return;
        }

        if (message.c.includes('spot@public.kline')) {
            this.handleChanelKline(message);
            return;
        }

        if (message.c.includes('spot@public.increase.aggre.depth')) {
            this.handleChanelOrderbook(message);
            return;
        }
    }

    private reconnectSocket(): void {
        this.stopPingPong();

        if (this.socket) {
            this.socket.removeAllListeners();

            if (this.socket.readyState == WebSocket.OPEN) {
                this.socket.terminate();
            }

            this.socket = null;
        }

        setTimeout(() => {
            this.initConnection();
        }, this.reconnectInterval);
    }

    private initPingTimeout(): void {
        this.pingTimeoutId = setTimeout(() => {
            this.reconnectSocket();
        }, this.pingTimeout);
    }

    private startPingPong(): void {
        this.pingIntervalId = setInterval(() => {
            if (!this.socket) {
                return;
            }

            const message = {
                method: 'PING'
            };
            this.socket.send(JSON.stringify(message));
            this.initPingTimeout();
        }, this.pingInterval);
    }

    private stopPingPong(): void {
        clearInterval(this.pingIntervalId);
        clearTimeout(this.pingTimeoutId);
    }

    private handleChanelMiniTicker(message: any) {
        const data = message.d;
        const priceData: PriceData = {
            symbol: data.s,
            price: data.p,
            timestamp: data.t,
            amount: data.q
        };

        this.emit('priceUpdated', priceData);
    }

    private handleChanelKline(message: any) {
        const data = message.d;
        const closeTime = data.t * 1000 + this.intervalToMilliseconds(data.interval) - 1;
        const klineData: KlineData = {
            openTime: data.t,
            symbol: data.symbol,
            interval: data.interval,
            open: data.o,
            close: data.c,
            high: data.h,
            low: data.l,
            closeTime
        };

        this.emit('klineUpdated', klineData);
    }

    private handleChanelOrderbook(message: any): any {
        const symbol = message.s;

        if (!this.orderBookStore[symbol]) {
            return;
        }

        const orderBook = this.orderBookStore[symbol];
        let arrayStoreBids = orderBook['bids'];
        let arrayStoreAsks = orderBook['asks'];

        const arrayUpdateBids = this.formatUpdatingOrderbook(message.d.bids);
        const arrayUpdateAsks = this.formatUpdatingOrderbook(message.d.asks);

        if (arrayUpdateBids.length) {
            arrayStoreBids = this.mergeUpdateArrays(arrayUpdateBids, arrayStoreBids, 'bids');
        }

        if (arrayUpdateAsks.length) {
            arrayStoreAsks = this.mergeUpdateArrays(arrayUpdateAsks, arrayStoreAsks, 'asks');
        }

        const result: OrderbookData = {
            bids: arrayStoreBids,
            asks: arrayStoreAsks
        };

        this.orderBookStore[symbol] = result;
    }

    private formatUpdatingOrderbook(updates: any[]): any[] {
        return updates.map(({
            a,
            ...rest
        }: {
            a: any,
            [key: string]: any
        }) => rest);
    }

    private mergeUpdateArrays(updateArray: any[], storeArray: any[], type: string): any[] {
        return updateArray.concat(
            storeArray.filter((item: any) => !updateArray.some((update: any) => update.p === item.p))
        ).filter(item => parseFloat(item.q) !== 0)
        .sort((a, b) => type === 'bids' ?
            parseFloat(b.p) - parseFloat(a.p) // Giảm dần
            :
            parseFloat(a.p) - parseFloat(b.p) // Tăng dần
        );;
    }

    private async getOrderBookStore(symbol: string): Promise < void > {
        const request: RequestInfo = new Request(`https://www.kcex.com/spot/api/spot/market/depth?symbol=${symbol}`, {
            method: 'GET'
        });
        try {
            const response = await fetch(request);
            const data = await response.json();
            const message = data.data;
            const result: OrderbookData = {
                bids: message.data.bids,
                asks: message.data.asks
            };

            if (!this.orderBookStore[symbol]) {
                this.orderBookStore[symbol] = result;
            }
        } catch (err: any) {
            console.error('Lỗi lấy dữ liệu orderbook:', err.message);
        }
    }

    private intervalToMilliseconds(interval: string): number {
        let unit = this.checkUnit(interval);
        switch (unit) {
            case 'Min':
                return parseInt(interval.substring(3)) * 60 * 1000;
            case 'Hour':
                return parseInt(interval.substring(4)) * 60 * 60 * 1000;
            case 'Day':
                return parseInt(interval.substring(3)) * 24 * 60 * 60 * 1000;
            case 'Week':
                return parseInt(interval.substring(4)) * 7 * 24 * 60 * 60 * 1000;
            case 'Month':
                return parseInt(interval.substring(5)) * 7 * 24 * 60 * 60 * 1000;
            default:
                console.error('Not support interval');
                return 0;
        }
    }

    private checkUnit(interval: string): string {
        if (interval.includes('Min')) {
            return 'Min';
        }
        if (interval.includes('Hour')) {
            return 'Hour';
        }
        if (interval.includes('Day')) {
            return 'Day';
        }
        if (interval.includes('Week')) {
            return 'Week';
        }
        if (interval.includes('Month')) {
            return 'Month'
        }
        return 'Not support';
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
const klineConfigs = [{
        symbol: 'BTC_USDT',
        interval: 'Min15'
    },
    {
        symbol: 'ETH_USDT',
        interval: 'Min15'
    }
];
const orderbookSymbols = ['BTC_USDT', 'ETH_USDT'];
client.on('hello', () => {
    //client.subscribePriceChannels(priceSymbols);
    //client.subscribeKlineChannels(klineConfigs);
    //client.subscribeOrderbookChannels(orderbookSymbols);
});

client.initConnection();
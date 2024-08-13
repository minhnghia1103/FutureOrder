import crypto from 'crypto';
interface body_market_open{
    symbol: string,
    openType: number,
    side: number,
    type: 5,
    vol: number,
    leverage: number,
    marketCeiling: false,
    priceProtect: 0
}

interface body_market_close{
    symbol: string,
    openType: number,
    side: number,
    type: 5,
    vol: number,
    leverage: number,
    priceProtect: 0
}

interface body_limit_open{
    symbol: string,
    openType: number,
    side: number,
    type: 1,
    vol: number,
    leverage: number,
    price: number,
    marketCeiling: false,
    priceProtect: 0
}
interface body_limit_close{
    symbol: string,
    openType: number,
    side: number,
    type: 1,
    vol: number,
    leverage: number,
    price: number,
    priceProtect: 0
}

class OrderFuture {
    public async futureOrder(body: body_market_open | body_market_close | body_limit_close | body_limit_open, cookie: string, authorization: string) {
        let headers = this.header(authorization, cookie, body);
        await this.connectApi(body, headers, 'https://www.kcex.com/fapi/v1/private/order/create') 
    }

    private header(authorization: string, cookie: string, body: body_market_open | body_market_close | body_limit_close | body_limit_open):Headers {
        const myHeaders = new Headers();
        let content_time = Date.now();
        let authorization_hash = this.authorizationHash(authorization, content_time.toString());
        let content_sign = this.contentSign(content_time.toString(), JSON.stringify(body), authorization_hash);
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('cookie', cookie);
        myHeaders.append('authorization', authorization);
        myHeaders.append('content-time', content_time.toString());
        myHeaders.append('content-sign', content_sign);
        return myHeaders
    }

    private contentSign(content_time:string, body: string, authorization_hash: string): string {
        const combined = content_time + body + authorization_hash
        const hash = crypto.createHash('md5').update(combined).digest('hex');
        return hash
    }

    private authorizationHash(authorization: string, content_time: string): string {
        const combined = authorization + content_time
        const hash = crypto.createHash('md5').update(combined).digest('hex').substr(7);
        return hash
    }


    private async connectApi(body: body_market_open | body_market_close | body_limit_close | body_limit_open, headers: Headers, url: string): Promise<void> {
        const requestOptions = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        }; 
    
        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    

}

const orderFuture = new OrderFuture();
const body_market_open: body_market_open = {
    symbol: "BTC_USDT",
    side: 1, // 1: long_open, 3: short_open, 4: long_close, 2: short_close
    openType: 1, // 1: isolated, 2: cross
    type: 5, // 5: market, 1: limit
    vol: 1.7, // 1vol = 5.9497 USDT
    leverage: 10, // đòn bẩy
    marketCeiling: false,
    priceProtect: 0
}
const body_market_close: body_market_close = {
    symbol: 'BTC_USDT',
    openType: 1,
    side: 4,
    type: 5,
    vol: 2,
    leverage: 11,
    priceProtect: 0
}
const body_limit_open: body_limit_open = {
    symbol: 'BTC_USDT',
    openType: 1,
    side: 1,
    type: 1,
    vol: 2,
    leverage: 10,
    price: 59451,
    marketCeiling: false,
    priceProtect: 0
}

const body_limit_close: body_limit_close = {
    symbol: 'BTC_USDT',
    openType: 1,
    side: 4,
    type: 1,
    vol: 2,
    leverage: 11,
    price: 59451,
    priceProtect: 0
}
const cookie = 'kcex_theme_main=light; kcex_exchange_orderbook_col3=quan; g_state={"i_l":0}; kcex_base_fiat=VND; NEXT_LOCALE=vi-VN; kcex_reset_tradingview_key=false; _iidt=PtLergYtK5TKjAIuEbuqIlZstQtU6dHpZOQzHmZP3cln5xPEC1fPlIUjI3LnJvQRMdjguo8cT84drg==; _vid_t=jv9aldEv1dN4Ko/airBNsiH7lbaMHQTv0qQ+024Zh6153u/koTBFLiI9s8GewS5Sq8UGKv/FjEwagA==; Authorization=WEB9d51f674194fab1dc41d417746ae2f7fe28e6890d5c15dd20b6238b1f1a6232f; __zlcmid=1MumtKpLoaG8qnv; kcex_new_guidance=true'
const authorization = 'WEB348596e998cc0ab8264a2d4f100f113054f85f6a5a32a9fc3ea2d75a75394769'
orderFuture.futureOrder(body_market_open, cookie, authorization)
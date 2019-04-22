import * as https from 'https';
import * as http from 'http';

export function httpGet<T = any>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        https.get(url, (res: http.IncomingMessage) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

export function httpPost<T = any>(hostname: string, urlPath: string, body?: any, authToken?: string) {
    return new Promise<T>((resolve, reject) => {
        const postData = !!body ? JSON.stringify(body) : '';

        const options: http.RequestOptions = {
            auth: authToken ? 'Bearer ' + authToken : undefined,
            hostname:  hostname,
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf8',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(!!data ? JSON.parse(data) : null);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        // write data to request body
        req.write(postData);
        req.end();
    });
}

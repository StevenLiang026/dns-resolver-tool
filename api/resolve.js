const dns = require('dns').promises;

// DNS服务器配置
const DNS_SERVERS = {
    'google': '8.8.8.8',
    'cloudflare': '1.1.1.1',
    'opendns': '208.67.222.222',
    'quad9': '9.9.9.9'
};

// DNS记录类型
const RECORD_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SOA', 'PTR'];

function executeDNSQuery(domain, recordType, dnsServer) {
    return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('DNS查询超时'));
        }, 8000);

        try {
            // 设置DNS服务器
            dns.setServers([dnsServer]);
            
            let result;
            let formattedResult = '';

            switch (recordType.toUpperCase()) {
                case 'A':
                    result = await dns.resolve4(domain);
                    formattedResult = result.join('\n');
                    break;
                case 'AAAA':
                    result = await dns.resolve6(domain);
                    formattedResult = result.join('\n');
                    break;
                case 'MX':
                    result = await dns.resolveMx(domain);
                    formattedResult = result.map(mx => `${mx.priority} ${mx.exchange}`).join('\n');
                    break;
                case 'CNAME':
                    result = await dns.resolveCname(domain);
                    formattedResult = result.join('\n');
                    break;
                case 'TXT':
                    result = await dns.resolveTxt(domain);
                    formattedResult = result.map(txt => txt.join(' ')).join('\n');
                    break;
                case 'NS':
                    result = await dns.resolveNs(domain);
                    formattedResult = result.join('\n');
                    break;
                case 'SOA':
                    result = await dns.resolveSoa(domain);
                    formattedResult = `${result.nsname} ${result.hostmaster} ${result.serial} ${result.refresh} ${result.retry} ${result.expire} ${result.minttl}`;
                    break;
                case 'PTR':
                    result = await dns.resolvePtr(domain);
                    formattedResult = result.join('\n');
                    break;
                default:
                    throw new Error('不支持的记录类型');
            }

            clearTimeout(timeout);
            resolve({
                domain,
                recordType,
                dnsServer,
                result: formattedResult,
                raw: formattedResult
            });

        } catch (error) {
            clearTimeout(timeout);
            
            if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
                resolve({
                    domain,
                    recordType,
                    dnsServer,
                    result: '未找到该类型的DNS记录',
                    raw: error.message
                });
            } else {
                reject(new Error(`DNS查询失败: ${error.message}`));
            }
        }
    });
}

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: '只支持POST请求' });
        return;
    }

    try {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { domain, recordType, dnsServer } = JSON.parse(body);

                if (!domain || !recordType) {
                    res.status(400).json({ error: '缺少必要参数' });
                    return;
                }

                if (!RECORD_TYPES.includes(recordType.toUpperCase())) {
                    res.status(400).json({ error: '不支持的记录类型' });
                    return;
                }

                // 如果指定了DNS服务器，只查询该服务器
                if (dnsServer && DNS_SERVERS[dnsServer]) {
                    const result = await executeDNSQuery(domain, recordType.toUpperCase(), DNS_SERVERS[dnsServer]);
                    res.json({
                        domain,
                        recordType: recordType.toUpperCase(),
                        results: [{
                            server: dnsServer,
                            serverIP: DNS_SERVERS[dnsServer],
                            ...result
                        }]
                    });
                    return;
                }

                // 否则查询所有DNS服务器
                const promises = Object.entries(DNS_SERVERS).map(async ([serverName, serverIP]) => {
                    try {
                        const result = await executeDNSQuery(domain, recordType.toUpperCase(), serverIP);
                        return {
                            server: serverName,
                            serverIP: serverIP,
                            ...result
                        };
                    } catch (error) {
                        return {
                            server: serverName,
                            serverIP: serverIP,
                            error: error.message,
                            result: '查询失败'
                        };
                    }
                });

                const results = await Promise.all(promises);
                
                res.json({
                    domain,
                    recordType: recordType.toUpperCase(),
                    results: results
                });

            } catch (error) {
                console.error('DNS解析错误:', error);
                res.status(500).json({ error: error.message });
            }
        });

    } catch (error) {
        console.error('请求处理错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
};

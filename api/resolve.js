const dns = require('dns').promises;
const { Resolver } = require('dns');

// DNS服务器配置
const DNS_SERVERS = {
    'google': '8.8.8.8',
    'cloudflare': '1.1.1.1',
    'opendns': '208.67.222.222',
    'quad9': '9.9.9.9'
};

// DNS记录类型
const RECORD_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'TXT', 'NS', 'SOA', 'PTR'];

async function executeDNSQuery(domain, recordType, dnsServerIP = null) {
    try {
        let resolver;
        
        // 如果指定了DNS服务器，创建专用解析器
        if (dnsServerIP) {
            resolver = new Resolver();
            resolver.setServers([dnsServerIP]);
        } else {
            // 使用系统默认DNS
            resolver = dns;
        }

        let result;
        let formattedResult = '';

        switch (recordType.toUpperCase()) {
            case 'A':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolve4(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolve4(domain);
                }
                formattedResult = result.join('\n');
                break;
            case 'AAAA':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolve6(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolve6(domain);
                }
                formattedResult = result.join('\n');
                break;
            case 'MX':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolveMx(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolveMx(domain);
                }
                formattedResult = result.map(mx => `${mx.priority} ${mx.exchange}`).join('\n');
                break;
            case 'CNAME':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolveCname(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolveCname(domain);
                }
                formattedResult = result.join('\n');
                break;
            case 'TXT':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolveTxt(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolveTxt(domain);
                }
                formattedResult = result.map(txt => txt.join(' ')).join('\n');
                break;
            case 'NS':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolveNs(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolveNs(domain);
                }
                formattedResult = result.join('\n');
                break;
            case 'SOA':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolveSoa(domain, (err, address) => {
                            if (err) reject(err);
                            else resolve(address);
                        });
                    });
                } else {
                    result = await dns.resolveSoa(domain);
                }
                formattedResult = `${result.nsname} ${result.hostmaster} ${result.serial} ${result.refresh} ${result.retry} ${result.expire} ${result.minttl}`;
                break;
            case 'PTR':
                if (dnsServerIP) {
                    result = await new Promise((resolve, reject) => {
                        resolver.resolvePtr(domain, (err, addresses) => {
                            if (err) reject(err);
                            else resolve(addresses);
                        });
                    });
                } else {
                    result = await dns.resolvePtr(domain);
                }
                formattedResult = result.join('\n');
                break;
            default:
                throw new Error('不支持的记录类型');
        }

        return {
            success: true,
            result: formattedResult,
            raw: result,
            addresses: Array.isArray(result) ? result : [result], // 保留原始IP数组
            count: Array.isArray(result) ? result.length : 1 // IP地址数量
        };

    } catch (error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
            return {
                success: false,
                result: '未找到该类型的DNS记录',
                error: error.message
            };
        } else {
            throw error;
        }
    }
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
        const { domain, recordType, dnsServer } = req.body;

        console.log('收到DNS解析请求:', { domain, recordType, dnsServer });

        if (!domain || !recordType) {
            res.status(400).json({ error: '缺少必要参数' });
            return;
        }

        if (!RECORD_TYPES.includes(recordType.toUpperCase())) {
            res.status(400).json({ error: '不支持的记录类型' });
            return;
        }

        // 如果指定了DNS服务器，返回单服务器结果
        if (dnsServer && DNS_SERVERS[dnsServer]) {
            console.log('单服务器查询:', dnsServer, DNS_SERVERS[dnsServer]);
            const queryResult = await executeDNSQuery(domain, recordType.toUpperCase(), DNS_SERVERS[dnsServer]);
            console.log('单服务器查询结果:', queryResult);
            console.log('原始结果数组:', queryResult.raw);
            console.log('地址数量:', queryResult.count);
            
            res.json({
                domain,
                recordType: recordType.toUpperCase(),
                dnsServer: dnsServer,
                result: queryResult.result,
                success: queryResult.success,
                addresses: queryResult.addresses, // 添加原始地址数组
                count: queryResult.count, // 添加地址数量
                raw: queryResult.raw // 添加原始数据用于调试
            });
            return;
        }

        console.log('开始多服务器查询...');

        // 否则查询所有DNS服务器（真正的多服务器查询）
        const promises = Object.entries(DNS_SERVERS).map(async ([serverName, serverIP]) => {
            try {
                const result = await executeDNSQuery(domain, recordType.toUpperCase(), serverIP);
                return {
                    server: serverName,
                    serverIP: serverIP,
                    domain,
                    recordType: recordType.toUpperCase(),
                    result: result.result,
                    success: result.success,
                    responseTime: Date.now() // 添加响应时间戳
                };
            } catch (error) {
                return {
                    server: serverName,
                    serverIP: serverIP,
                    domain,
                    recordType: recordType.toUpperCase(),
                    result: '查询失败',
                    success: false,
                    error: error.message
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
        res.status(500).json({ 
            error: `DNS解析失败: ${error.message}`,
            details: error.code || 'UNKNOWN_ERROR'
        });
    }
};
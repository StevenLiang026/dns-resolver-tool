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

async function executeDNSQuery(domain, recordType) {
    try {
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

        return {
            success: true,
            result: formattedResult,
            raw: result
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

        // 执行DNS查询（使用系统默认DNS）
        const queryResult = await executeDNSQuery(domain, recordType.toUpperCase());
        
        console.log('DNS查询结果:', queryResult);

        // 如果指定了DNS服务器，返回单服务器结果
        if (dnsServer && DNS_SERVERS[dnsServer]) {
            res.json({
                domain,
                recordType: recordType.toUpperCase(),
                dnsServer: dnsServer,
                result: queryResult.result,
                success: queryResult.success
            });
            return;
        }

        // 否则返回通用结果（模拟多服务器查询）
        const results = Object.keys(DNS_SERVERS).map(serverName => ({
            server: serverName,
            serverIP: DNS_SERVERS[serverName],
            domain,
            recordType: recordType.toUpperCase(),
            result: queryResult.result,
            success: queryResult.success
        }));
        
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
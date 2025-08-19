const { exec } = require('child_process');

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
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('DNS查询超时'));
        }, 8000);

        const command = `nslookup -type=${recordType} ${domain} ${dnsServer}`;
        
        exec(command, (error, stdout, stderr) => {
            clearTimeout(timeout);
            
            if (error) {
                reject(new Error(`DNS查询失败: ${error.message}`));
                return;
            }

            const result = stdout.toString();
            
            // 检查是否找到记录
            if (result.includes('NXDOMAIN') || result.includes('can\'t find')) {
                resolve({
                    domain,
                    recordType,
                    dnsServer,
                    result: '未找到该类型的DNS记录',
                    raw: result
                });
                return;
            }

            resolve({
                domain,
                recordType,
                dnsServer,
                result: result,
                raw: result
            });
        });
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

                if (!domain || !recordType || !dnsServer) {
                    res.status(400).json({ error: '缺少必要参数' });
                    return;
                }

                if (!RECORD_TYPES.includes(recordType.toUpperCase())) {
                    res.status(400).json({ error: '不支持的记录类型' });
                    return;
                }

                if (!DNS_SERVERS[dnsServer]) {
                    res.status(400).json({ error: '不支持的DNS服务器' });
                    return;
                }

                const result = await executeDNSQuery(domain, recordType.toUpperCase(), DNS_SERVERS[dnsServer]);
                res.json(result);

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
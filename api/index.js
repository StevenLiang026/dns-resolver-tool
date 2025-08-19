const { exec } = require('child_process');
const url = require('url');

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

    if (req.method === 'GET') {
        // 返回静态文件内容
        const { pathname } = url.parse(req.url);
        
        if (pathname === '/' || pathname === '/index.html') {
            const fs = require('fs');
            const path = require('path');
            try {
                const indexPath = path.join(process.cwd(), 'index.html');
                const content = fs.readFileSync(indexPath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                res.status(200).send(content);
            } catch (error) {
                res.status(404).send('File not found');
            }
            return;
        }

        if (pathname === '/style.css') {
            const fs = require('fs');
            const path = require('path');
            try {
                const cssPath = path.join(process.cwd(), 'style.css');
                const content = fs.readFileSync(cssPath, 'utf8');
                res.setHeader('Content-Type', 'text/css');
                res.status(200).send(content);
            } catch (error) {
                res.status(404).send('File not found');
            }
            return;
        }

        if (pathname === '/script.js') {
            const fs = require('fs');
            const path = require('path');
            try {
                const jsPath = path.join(process.cwd(), 'script.js');
                const content = fs.readFileSync(jsPath, 'utf8');
                res.setHeader('Content-Type', 'application/javascript');
                res.status(200).send(content);
            } catch (error) {
                res.status(404).send('File not found');
            }
            return;
        }

        res.status(404).send('Not found');
        return;
    }

    if (req.method === 'POST' && req.url === '/api/resolve') {
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
        return;
    }

    res.status(404).json({ error: '接口不存在' });
};
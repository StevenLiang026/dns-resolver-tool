const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;
const execAsync = util.promisify(exec);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 权威DNS服务器配置
const DNS_SERVERS = [
    '8.8.8.8',          // Google DNS (主)
    '1.1.1.1',          // Cloudflare DNS (主)
    '208.67.222.222',   // OpenDNS (主)
    '9.9.9.9'           // Quad9 DNS (安全)
];

// 使用系统nslookup命令进行DNS解析
async function resolveDNS(domain, recordType) {
    const results = [];
    
    try {
        // 使用Google DNS进行查询
        const dnsServer = '8.8.8.8';
        let command = '';
        
        switch (recordType.toLowerCase()) {
            case 'a':
                command = `nslookup -type=A ${domain} ${dnsServer}`;
                break;
            case 'aaaa':
                command = `nslookup -type=AAAA ${domain} ${dnsServer}`;
                break;
            case 'cname':
                command = `nslookup -type=CNAME ${domain} ${dnsServer}`;
                break;
            case 'mx':
                command = `nslookup -type=MX ${domain} ${dnsServer}`;
                break;
            case 'ns':
                command = `nslookup -type=NS ${domain} ${dnsServer}`;
                break;
            case 'txt':
                command = `nslookup -type=TXT ${domain} ${dnsServer}`;
                break;
            case 'soa':
                command = `nslookup -type=SOA ${domain} ${dnsServer}`;
                break;
            case 'ptr':
                command = `nslookup -type=PTR ${domain} ${dnsServer}`;
                break;
            default:
                command = `nslookup -type=A ${domain} ${dnsServer}`;
        }
        
        console.log(`执行DNS查询: ${command}`);
        
        const { stdout, stderr } = await execAsync(command, { 
            timeout: 10000,
            encoding: 'utf8'
        });
        
        console.log(`DNS查询结果:\n${stdout}`);
        
        // 解析nslookup输出
        const lines = stdout.split('\n');
        let foundResults = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (recordType.toLowerCase() === 'a') {
                // 匹配A记录的IP地址
                const ipMatch = trimmedLine.match(/Address:\s*(\d+\.\d+\.\d+\.\d+)$/);
                if (ipMatch && ipMatch[1] !== dnsServer) {
                    results.push({
                        type: 'A',
                        value: ipMatch[1],
                        ttl: 300,
                        dns_server: `Google DNS (${dnsServer})`
                    });
                    foundResults = true;
                }
            } else if (recordType.toLowerCase() === 'cname') {
                // 匹配CNAME记录
                const cnameMatch = trimmedLine.match(/canonical name = (.+)$/);
                if (cnameMatch) {
                    results.push({
                        type: 'CNAME',
                        value: cnameMatch[1].replace(/\.$/, ''),
                        ttl: 300,
                        dns_server: `Google DNS (${dnsServer})`
                    });
                    foundResults = true;
                }
            } else if (recordType.toLowerCase() === 'mx') {
                // 匹配MX记录
                const mxMatch = trimmedLine.match(/mail exchanger = (\d+)\s+(.+)$/);
                if (mxMatch) {
                    results.push({
                        type: 'MX',
                        value: mxMatch[2].replace(/\.$/, ''),
                        priority: parseInt(mxMatch[1]),
                        ttl: 300,
                        dns_server: `Google DNS (${dnsServer})`
                    });
                    foundResults = true;
                }
            } else if (recordType.toLowerCase() === 'ns') {
                // 匹配NS记录
                const nsMatch = trimmedLine.match(/nameserver = (.+)$/);
                if (nsMatch) {
                    results.push({
                        type: 'NS',
                        value: nsMatch[1].replace(/\.$/, ''),
                        ttl: 300,
                        dns_server: `Google DNS (${dnsServer})`
                    });
                    foundResults = true;
                }
            } else if (recordType.toLowerCase() === 'txt') {
                // 匹配TXT记录
                const txtMatch = trimmedLine.match(/text = "(.+)"$/);
                if (txtMatch) {
                    results.push({
                        type: 'TXT',
                        value: txtMatch[1],
                        ttl: 300,
                        dns_server: `Google DNS (${dnsServer})`
                    });
                    foundResults = true;
                }
            }
        }
        
        // 如果没有找到结果，检查是否有错误信息
        if (!foundResults) {
            if (stdout.includes('can\'t find') || stdout.includes('NXDOMAIN') || stderr) {
                results.push({
                    type: recordType,
                    error: `该域名没有 ${recordType} 记录`,
                    dns_server: `Google DNS (${dnsServer})`
                });
            } else if (stdout.includes('Non-authoritative answer')) {
                results.push({
                    type: recordType,
                    error: `DNS服务器响应正常，但未找到 ${recordType} 记录`,
                    dns_server: `Google DNS (${dnsServer})`
                });
            } else {
                results.push({
                    type: recordType,
                    error: `DNS查询完成，但无法解析 ${recordType} 记录格式`,
                    dns_server: `Google DNS (${dnsServer})`
                });
            }
        }
        
    } catch (error) {
        console.error('DNS解析错误:', error);
        results.push({
            type: recordType,
            error: `DNS解析失败: ${error.message}`,
            dns_server: 'Google DNS (8.8.8.8)'
        });
    }
    
    return results;
}

// 获取IP地理位置信息
async function getIPLocation(ip) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
        
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                return {
                    country: data.country || '',
                    region: data.regionName || '',
                    city: data.city || '',
                    isp: data.isp || ''
                };
            }
        }
    } catch (error) {
        console.log(`获取IP位置失败 ${ip}:`, error.message);
    }
    
    return {};
}

// 检测CDN
function detectCDN(records) {
    const cdnPatterns = {
        'Cloudflare': [/cloudflare/i, /cf-ray/i],
        'AWS CloudFront': [/cloudfront/i, /amazonaws/i],
        'Fastly': [/fastly/i],
        'Google Cloud CDN': [/googleapis/i, /gstatic/i],
        'Akamai': [/akamai/i],
        '腾讯云CDN': [/qcloud/i, /tencent-cloud/i],
        '阿里云CDN': [/alicdn/i, /aliyuncs/i],
        '百度云CDN': [/bcebos/i, /baidubce/i]
    };
    
    const detectedCDNs = [];
    
    records.forEach(record => {
        if (record.type === 'CNAME' && record.value) {
            const value = record.value.toLowerCase();
            Object.entries(cdnPatterns).forEach(([cdnName, patterns]) => {
                patterns.forEach(pattern => {
                    if (pattern.test(value) && !detectedCDNs.includes(cdnName)) {
                        detectedCDNs.push(cdnName);
                    }
                });
            });
        }
    });
    
    return detectedCDNs;
}

// 路由：首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 路由：DNS解析
app.post('/resolve', async (req, res) => {
    try {
        const { domain, type } = req.body;
        
        if (!domain) {
            return res.status(400).json({ error: '请提供域名' });
        }
        
        if (!type) {
            return res.status(400).json({ error: '请提供记录类型' });
        }
        
        console.log(`收到DNS解析请求: ${domain} (${type})`);
        
        // 解析DNS记录
        const records = await resolveDNS(domain, type);
        
        // 获取IP地理位置（仅对A记录）
        const ipLocations = {};
        if (type.toLowerCase() === 'a') {
            for (const record of records) {
                if (record.value && !record.error) {
                    const location = await getIPLocation(record.value);
                    if (Object.keys(location).length > 0) {
                        ipLocations[record.value] = location;
                    }
                }
            }
        }
        
        // 检测CDN
        const detectedCDNs = detectCDN(records);
        
        const result = {
            domain: domain,
            timestamp: new Date().toISOString(),
            dns_records: {
                [type.toUpperCase()]: records
            },
            detected_cdns: detectedCDNs,
            ip_locations: ipLocations
        };
        
        console.log(`DNS解析完成: ${domain} - ${records.length} 条记录`);
        res.json(result);
        
    } catch (error) {
        console.error('DNS解析API错误:', error);
        res.status(500).json({ 
            error: `服务器错误: ${error.message}`,
            domain: req.body.domain || '',
            timestamp: new Date().toISOString()
        });
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dns_servers: DNS_SERVERS
    });
});

// 启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log('🚀 DNS解析工具 - Node.js版本 (系统命令版)');
        console.log('==================================================');
        console.log(`🌐 服务器运行在: http://localhost:${PORT}`);
        console.log('🔧 使用权威DNS服务器:');
        DNS_SERVERS.forEach((server, index) => {
            console.log(`   ${index + 1}. ${server}`);
        });
        console.log('💡 使用系统nslookup命令进行DNS解析');
        console.log('⏹️  按 Ctrl+C 停止服务器');
        console.log('==================================================');
    });
}

// 导出app供Vercel使用
module.exports = app;

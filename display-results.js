// 显示解析结果 - 支持多服务器
function displayResults(data) {
    if (!resultsContent) return;
    
    let html = `
        <div class="dns-results">
            <div class="results-header">
                <h3>📊 DNS解析结果</h3>
                <div class="result-meta">
                    <span class="domain">${data.domain || '未知域名'}</span>
                    <span class="timestamp">${new Date().toLocaleString('zh-CN')}</span>
                </div>
            </div>
            <div class="dns-records-section">
                <h4 class="record-type-title">${data.recordType || 'DNS'} 记录</h4>
    `;
    
    // 处理多服务器结果
    if (data.results && Array.isArray(data.results)) {
        data.results.forEach(serverResult => {
            const serverName = getServerDisplayName(serverResult.server);
            const serverIcon = getServerIcon(serverResult.server);
            
            html += `
                <div class="server-section">
                    <div class="server-header">
                        <span class="server-icon">${serverIcon}</span>
                        <span class="server-name">${serverName}</span>
                        <span class="server-ip">(${serverResult.serverIP})</span>
                    </div>
                    <div class="records-list">
            `;
            
            if (serverResult.error) {
                html += `
                    <div class="record-item error">
                        <span class="record-icon">❌</span>
                        <div class="record-details">
                            <span class="record-value">查询失败: ${serverResult.error}</span>
                        </div>
                    </div>
                `;
            } else if (serverResult.result && serverResult.result !== '未找到该类型的DNS记录') {
                html += `
                    <div class="record-item success">
                        <span class="record-icon">✅</span>
                        <div class="record-details">
                            <div class="record-value">${serverResult.result.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="record-item info">
                        <span class="record-icon">ℹ️</span>
                        <div class="record-details">
                            <span class="record-value">未找到该类型的DNS记录</span>
                        </div>
                    </div>
                `;
            }
            
            html += '</div></div>';
        });
    } else {
        // 处理单服务器结果（向后兼容）
        if (data.result && data.result !== '未找到该类型的DNS记录') {
            html += `
                <div class="records-list">
                    <div class="record-item success">
                        <span class="record-icon">✅</span>
                        <div class="record-details">
                            <div class="record-value">${data.result.replace(/\n/g, '<br>')}</div>
                            <div class="record-meta">
                                <span class="dns-server">DNS服务器: ${data.dnsServer || 'Google'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const suggestions = {
                'A': '建议检查域名是否正确，或尝试 CNAME 记录',
                'AAAA': '该域名可能不支持IPv6，建议尝试 A 记录',
                'CNAME': '该域名可能是根域名，建议尝试 A 记录',
                'MX': '该域名可能没有配置邮件服务，这是正常的',
                'NS': '该域名可能没有配置名称服务器记录',
                'TXT': '该域名没有配置文本记录，这是正常的',
                'SOA': '该域名可能没有权威记录',
                'PTR': '该IP地址没有反向DNS记录'
            };
            
            html += `
                <div class="records-list">
                    <div class="record-item info">
                        <span class="record-icon">ℹ️</span>
                        <div class="record-details">
                            <span class="record-value">该域名没有 ${data.recordType || 'DNS'} 记录</span>
                            <div class="record-meta">
                                <span class="suggestion">💡 ${suggestions[data.recordType] || '建议尝试其他记录类型'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div></div>';
    
    // 平滑过渡显示结果
    setTimeout(() => {
        resultsContent.innerHTML = html;
        resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// 获取服务器显示名称
function getServerDisplayName(serverKey) {
    const serverNames = {
        'google': 'Google DNS',
        'cloudflare': 'Cloudflare DNS',
        'opendns': 'OpenDNS',
        'quad9': 'Quad9 DNS'
    };
    return serverNames[serverKey] || serverKey;
}

// 获取服务器图标
function getServerIcon(serverKey) {
    const serverIcons = {
        'google': '🔍',
        'cloudflare': '⚡',
        'opendns': '🛡️',
        'quad9': '🔒'
    };
    return serverIcons[serverKey] || '🌐';
}
// DNS解析工具前端脚本 - 修复版本

document.addEventListener('DOMContentLoaded', function() {
    // 获取页面元素
    const domainInput = document.getElementById('domain');
    const recordTypeSelect = document.getElementById('record-type');
    const dnsServerInput = document.getElementById('dns-server');
    const resolveBtn = document.getElementById('resolve-btn');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const exportBtn = document.getElementById('export-btn');
    
    let currentResults = null;
    
    // 检查元素是否存在
    console.log('域名输入框:', domainInput);
    console.log('解析按钮:', resolveBtn);
    console.log('记录类型选择:', recordTypeSelect);
    
    // 绑定事件
    if (resolveBtn) {
        resolveBtn.addEventListener('click', handleResolve);
        console.log('解析按钮事件已绑定');
    } else {
        console.error('找不到解析按钮元素');
    }
    
    if (domainInput) {
        domainInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleResolve();
            }
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportResults);
    }
    
    // 主要的DNS解析函数
    async function handleResolve() {
        console.log('开始解析...');
        
        const domain = domainInput.value.trim();
        const recordType = recordTypeSelect.value;
        const dnsServer = dnsServerInput.value;
        
        console.log('域名:', domain);
        console.log('记录类型:', recordType);
        console.log('DNS服务器:', dnsServer);
        
        if (!domain) {
            showError('请输入域名');
            return;
        }
        
        if (!isValidDomain(domain)) {
            showError('请输入有效的域名格式');
            return;
        }
        
        // 显示加载状态
        if (resultsSection) {
            resultsSection.style.display = 'block';
            const serverText = dnsServer === 'all' ? '所有DNS服务器' : `${dnsServer} DNS服务器`;
            resultsContent.innerHTML = `
                <div class="loading-simple">
                    <div class="loading-spinner">🔄</div>
                    <div class="loading-text">正在通过 ${serverText} 解析 ${domain} 的 ${recordType} 记录...</div>
                </div>
            `;
        }
        
        try {
            const requestBody = {
                domain: domain,
                recordType: recordType
            };
            
            // 如果不是查询所有服务器，则指定DNS服务器
            if (dnsServer !== 'all') {
                requestBody.dnsServer = dnsServer;
            }
            
            const response = await fetch('/api/resolve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('响应状态:', response.status);
            
            const data = await response.json();
            console.log('响应数据:', data);
            
            if (response.ok) {
                displayResults(data);
                currentResults = data;
            } else {
                showError('解析失败: ' + (data.error || '未知错误'));
            }
        } catch (error) {
            console.error('请求错误:', error);
            showError('网络错误: ' + error.message);
        }
    }
    
    // 显示解析过程
    function showResolutionProcess(domain, recordType) {
        if (!resultsSection) return;
        
        resultsSection.style.display = 'block';
        
        const processSteps = [
            { id: 'step1', text: '🔍 开始解析域名...', delay: 0 },
            { id: 'step2', text: `📡 查询 ${recordType} 记录类型...`, delay: 400 },
            { id: 'step3', text: '🌐 连接DNS服务器...', delay: 800 },
            { id: 'step4', text: '⚡ 处理DNS响应数据...', delay: 1200 }
        ];
        
        let processHTML = `
            <div class="resolution-process">
                <div class="process-header">
                    <h3>🚀 DNS解析过程</h3>
                    <div class="domain-info">
                        <span class="domain-name">${domain}</span>
                        <span class="record-type-badge">${recordType}</span>
                    </div>
                </div>
                <div class="process-steps">
        `;
        
        processSteps.forEach(step => {
            processHTML += `
                <div class="process-step" id="${step.id}">
                    <span class="step-icon">⏳</span>
                    <span class="step-text">${step.text}</span>
                    <span class="step-time"></span>
                </div>
            `;
        });
        
        processHTML += `
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
        `;
        
        resultsContent.innerHTML = processHTML;
        
        // 逐步显示解析过程
        processSteps.forEach((step, index) => {
            setTimeout(() => {
                updateProcessStep(step.id, step.text, 'running');
                updateProgressBar((index + 1) / processSteps.length * 90);
            }, step.delay);
        });
    }
    
    // 更新解析步骤状态
    function updateProcessStep(stepId, text, status = 'completed') {
        const stepElement = document.getElementById(stepId);
        if (!stepElement) return;
        
        const iconElement = stepElement.querySelector('.step-icon');
        const textElement = stepElement.querySelector('.step-text');
        const timeElement = stepElement.querySelector('.step-time');
        
        const currentTime = new Date().toLocaleTimeString();
        
        if (status === 'running') {
            iconElement.textContent = '🔄';
            stepElement.classList.add('running');
            timeElement.textContent = currentTime;
        } else if (status === 'completed') {
            iconElement.textContent = '✅';
            stepElement.classList.remove('running');
            stepElement.classList.add('completed');
            timeElement.textContent = currentTime;
        } else if (status === 'error') {
            iconElement.textContent = '❌';
            stepElement.classList.remove('running');
            stepElement.classList.add('error');
            textElement.textContent = text;
            timeElement.textContent = currentTime;
            updateProgressBar(100, true);
        } else if (status === 'complete') {
            // 完成所有步骤
            const allSteps = document.querySelectorAll('.process-step');
            allSteps.forEach(step => {
                const icon = step.querySelector('.step-icon');
                const time = step.querySelector('.step-time');
                icon.textContent = '✅';
                step.classList.remove('running');
                step.classList.add('completed');
                if (!time.textContent) {
                    time.textContent = currentTime;
                }
            });
            
            updateProgressBar(100);
            
            // 添加完成消息
            const processDiv = document.querySelector('.resolution-process');
            if (processDiv) {
                const completeMsg = document.createElement('div');
                completeMsg.className = 'completion-message';
                completeMsg.innerHTML = `
                    <div class="success-banner">
                        <span class="success-icon">🎉</span>
                        <span class="success-text">${text}</span>
                        <span class="success-time">${currentTime}</span>
                    </div>
                `;
                processDiv.appendChild(completeMsg);
            }
        }
    }
    
    // 更新进度条
    function updateProgressBar(percentage, isError = false) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
            if (isError) {
                progressFill.style.backgroundColor = '#e74c3c';
            } else if (percentage === 100) {
                progressFill.style.backgroundColor = '#27ae60';
            }
        }
    }
    
    // 显示解析结果
    function displayResults(data) {
        if (!resultsContent) return;
        
        console.log('显示结果数据:', data);
        
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
                    <div class="record-type-section">
                        <h4 class="record-type-title">${data.recordType || 'DNS'} 记录</h4>
                        <div class="records-list">
        `;
        
        // 检查是单服务器查询还是多服务器查询
        if (data.results && Array.isArray(data.results)) {
            // 多服务器查询结果
            console.log('处理多服务器查询结果');
            data.results.forEach(serverResult => {
                const serverName = serverResult.server || 'Unknown';
                const serverIP = serverResult.serverIP || '';
                const result = serverResult.result || '查询失败';
                const success = serverResult.success;
                
                if (success && result !== '未找到该类型的DNS记录') {
                    // 处理多个IP地址的显示
                    const addresses = result.split('\n').filter(addr => addr.trim());
                    const addressCount = addresses.length;
                    
                    html += `
                        <div class="record-item success">
                            <span class="record-icon">✅</span>
                            <div class="record-details">
                                <div class="record-header">
                                    <span class="dns-server">${serverName.toUpperCase()} DNS (${serverIP})</span>
                                    <span class="address-count">${addressCount} 个地址</span>
                                </div>
                                <div class="record-addresses">
                    `;
                    
                    // 为每个IP地址创建单独的显示项
                    addresses.forEach((address, index) => {
                        html += `
                            <div class="address-item">
                                <span class="address-index">#${index + 1}</span>
                                <span class="address-value">${address}</span>
                                <button class="copy-btn" onclick="copyToClipboard('${address}')" title="复制IP地址">📋</button>
                            </div>
                        `;
                    });
                    
                    html += `
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="record-item warning">
                            <span class="record-icon">⚠️</span>
                            <div class="record-details">
                                <div class="record-value">${result}</div>
                                <div class="record-meta">
                                    <span class="dns-server">${serverName.toUpperCase()} DNS (${serverIP})</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        } else if (data.result) {
            // 单服务器查询结果
            console.log('处理单服务器查询结果');
            if (data.result !== '未找到该类型的DNS记录') {
                html += `
                    <div class="record-item success">
                        <span class="record-icon">✅</span>
                        <div class="record-details">
                            <div class="record-value">${data.result.replace(/\n/g, '<br>')}</div>
                            <div class="record-meta">
                                <span class="dns-server">DNS服务器: ${data.dnsServer || 'Default'}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // 显示未找到记录的友好提示
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
                    <div class="record-item info">
                        <span class="record-icon">ℹ️</span>
                        <div class="record-details">
                            <span class="record-value">该域名没有 ${data.recordType || 'DNS'} 记录</span>
                            <div class="record-meta">
                                <span class="suggestion">💡 ${suggestions[data.recordType] || '建议尝试其他记录类型'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // 没有结果数据
            html += `
                <div class="record-item error">
                    <span class="record-icon">❌</span>
                    <div class="record-details">
                        <span class="record-value">DNS解析失败，没有返回结果</span>
                        <div class="record-meta">
                            <span class="suggestion">💡 请检查网络连接或稍后重试</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 平滑过渡显示结果
        setTimeout(() => {
            resultsContent.innerHTML = html;
            resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
    
    // 显示错误信息
    function showError(message) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.style.display = 'flex';
            
            // 5秒后自动隐藏错误消息
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
        console.error('错误:', message);
    }
    
    // 验证域名格式
    function isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return domainRegex.test(domain) && domain.length <= 253;
    }
    
    // 格式化时间戳
    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    }
    
    // 导出结果
    function exportResults() {
        if (!currentResults) {
            showError('没有可导出的结果');
            return;
        }
        
        const dataStr = JSON.stringify(currentResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dns-analysis-${currentResults.domain}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
    
    // 复制到剪贴板函数
    window.copyToClipboard = function(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // 使用现代 Clipboard API
            navigator.clipboard.writeText(text).then(() => {
                showCopySuccess();
            }).catch(err => {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            // 降级方案
            fallbackCopyTextToClipboard(text);
        }
    };

    // 降级复制方案
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess();
            } else {
                console.error('复制失败');
            }
        } catch (err) {
            console.error('复制失败:', err);
        }
        
        document.body.removeChild(textArea);
    }

    // 显示复制成功提示
    function showCopySuccess() {
        // 创建临时提示元素
        const toast = document.createElement('div');
        toast.textContent = '✅ IP地址已复制到剪贴板';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    console.log('DNS解析工具脚本已加载完成');
});

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

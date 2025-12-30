// 当页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 设置当前年份
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // 从本地存储加载数据并更新统计
    updateStatistics();
    
    // 处理表单提交
    const vehicleForm = document.getElementById('vehicleForm');
    vehicleForm.addEventListener('submit', handleFormSubmit);
    
    // 处理图片上传
    setupImageUpload();
    
    // 处理表单重置
    vehicleForm.addEventListener('reset', handleFormReset);
});

// 处理表单提交
function handleFormSubmit(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    
    // 获取表单数据
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        idCard: document.getElementById('idCard').value,
        plateNumber: document.getElementById('plateNumber').value,
        vehicleType: document.getElementById('vehicleType').value,
        usageType: document.getElementById('usageType').value,
        registrant: document.getElementById('registrant').value,
        images: getUploadedImages(),
        submissionDate: new Date().toLocaleString('zh-CN'),
        submissionId: generateSubmissionId()
    };
    
    // 保存到本地存储
    saveSubmission(formData);
    
    // 显示成功消息
    showMessage('信息提交成功！感谢您的配合。', 'success');
    
    // 更新统计信息
    updateStatistics();
    
    // 重置表单（但不清除图片）
    resetFormWithoutImages();
    
    // 3秒后隐藏消息
    setTimeout(() => {
        hideMessage();
    }, 3000);
}

// 生成唯一的提交ID
function generateSubmissionId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `S${timestamp}${random}`;
}

// 获取已上传的图片
function getUploadedImages() {
    const previewItems = document.querySelectorAll('.preview-item img');
    const images = [];
    
    previewItems.forEach(item => {
        // 这里我们只存储图片名称，实际应用中会上传到服务器
        images.push(item.alt || '车辆照片');
    });
    
    return images;
}

// 保存提交数据到本地存储
function saveSubmission(data) {
    // 从本地存储获取现有数据
    let submissions = JSON.parse(localStorage.getItem('trafficSubmissions') || '[]');
    
    // 添加新数据
    submissions.push(data);
    
    // 保存回本地存储
    localStorage.setItem('trafficSubmissions', JSON.stringify(submissions));
}

// 更新统计信息
function updateStatistics() {
    const submissions = JSON.parse(localStorage.getItem('trafficSubmissions') || '[]');
    const today = new Date().toDateString();
    
    // 计算统计数据
    const todayCount = submissions.filter(sub => {
        const subDate = new Date(sub.submissionDate).toDateString();
        return subDate === today;
    }).length;
    
    const totalCount = submissions.length;
    
    const carCount = submissions.filter(sub => 
        sub.vehicleType === '小型汽车'
    ).length;
    
    const motorcycleCount = submissions.filter(sub => 
        sub.vehicleType === '摩托车'
    ).length;
    
    // 更新显示
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('carCount').textContent = carCount;
    document.getElementById('motorcycleCount').textContent = motorcycleCount;
}

// 显示消息
function showMessage(text, type) {
    const messageDiv = document.getElementById('resultMessage');
    messageDiv.textContent = text;
    messageDiv.className = `result-message ${type}`;
}

// 隐藏消息
function hideMessage() {
    const messageDiv = document.getElementById('resultMessage');
    messageDiv.style.display = 'none';
}

// 设置图片上传功能
function setupImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('imageUpload');
    const previewContainer = document.getElementById('imagePreview');
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 处理文件选择
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        
        // 限制最多3张图片
        if (files.length > 3) {
            showMessage('最多只能上传3张图片', 'error');
            return;
        }
        
        // 预览每张图片
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                showMessage('只能上传图片文件', 'error');
                continue;
            }
            
            // 创建文件阅读器
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // 创建预览元素
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `车辆照片 ${i + 1}`;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', () => {
                    previewItem.remove();
                });
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                previewContainer.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        }
        
        // 重置文件输入，允许再次选择相同文件
        fileInput.value = '';
    });
    
    // 拖拽上传功能
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#4fc3f7';
        uploadArea.style.backgroundColor = '#f0f9ff';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#aaa';
        uploadArea.style.backgroundColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#aaa';
        uploadArea.style.backgroundColor = '';
        
        // 获取拖拽的文件
        const files = e.dataTransfer.files;
        fileInput.files = files;
        
        // 触发change事件
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    });
}

// 重置表单但不清除图片
function resetFormWithoutImages() {
    // 清除所有表单字段
    document.getElementById('vehicleForm').reset();
    
    // 保留图片预览
    // 实际上我们不清除图片预览，但用户可以手动删除
}

// 处理表单重置（包括图片）
function handleFormReset() {
    // 清除图片预览
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';
}
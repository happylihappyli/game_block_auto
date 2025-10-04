// 游戏常量
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#1a1a1a',        // 空白
    '#3333ff',        // 蓝色
    '#00ff00',        // 绿色
    '#ff0000',        // 红色
    '#ffff00',        // 黄色
    '#ff00ff',        // 紫色
    '#00ffff',        // 青色
    '#ff8000'         // 橙色
];

// 方块形状定义
const SHAPES = [
    [[0]],  // 空白
    // I 形
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J 形
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L 形
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O 形
    [
        [4, 4],
        [4, 4]
    ],
    // S 形
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T 形
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z 形
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 游戏状态变量
let board = [];  // 游戏板
let currentPiece = {};  // 当前方块
let nextPiece = {};  // 下一个方块
let score = 0;  // 得分
let lines = 0;  // 消除行数
let level = 1;  // 等级
let gameSpeed = 1.0;  // 游戏速度
let isGameOver = false;  // 游戏是否结束
let isPaused = false;  // 游戏是否暂停
let autoDropTimer = null;  // 自动下落计时器
let isAiMode = false;  // 是否为AI模式
let aiMoveDelay = 50;  // AI移动延迟（毫秒）- 增加延迟以减少频繁移动
let aiMoveTimer = null;  // AI移动计时器
let aiDropSpeed = 3;  // AI模式下的下落速度倍数
let customEvaluateFunction = null; // 存储用户自定义的评分函数
let defaultFormula = 'return clearedLines * 3000 + currentY*300 +weight*10 - holes * 1000 - narrow*400;'; // 默认评分公式
let gameRecords = []; // 存储游戏记录
const MAX_RECORDS = 10; // 最多保留10条记录

// DOM 元素引用
let gameBoard = document.getElementById('gameBoard');
let nextPieceBoard = document.getElementById('nextPiece');
let scoreDisplay = document.getElementById('score');
let linesDisplay = document.getElementById('lines');
let levelDisplay = document.getElementById('level');
let statusDisplay = document.getElementById('status');
let gameOverPanel = document.getElementById('gameOverPanel');
let finalScoreDisplay = document.getElementById('finalScore');
let startButton = document.getElementById('startButton');
let pauseButton = document.getElementById('pauseButton');
let aiModeButton = document.getElementById('aiModeButton');
let restartButton = document.getElementById('restartButton');
let playAgainButton = document.getElementById('playAgainButton');
let showRecordsButton = document.getElementById('showRecordsButton');
let gameRecordsPanel = document.getElementById('gameRecordsPanel');
let recordsList = document.getElementById('recordsList');

// 初始化游戏
function initializeGame() {
    // 初始化游戏板
    board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board.push(new Array(BOARD_WIDTH).fill(0));
    }
    
    // 创建网格视觉元素
    createGridElements();
    
    // 重置游戏状态
    score = 0;
    lines = 0;
    level = 1;
    gameSpeed = 1.0;
    isGameOver = false;
    isPaused = false;
    
    // 生成初始方块
    nextPiece = generateRandomPiece();
    spawnNextPiece();
    
    // 更新UI
    updateUI();
    
    // 隐藏游戏结束面板
    gameOverPanel.classList.add('hidden');
    
    // 设置状态标签
    statusDisplay.textContent = '准备开始';
    
    // 更新按钮状态
    updateButtonStates();
    
    // 确保评分公式编辑器显示当前使用的公式
    updateFormulaEditor();
}

// 创建网格视觉元素
function createGridElements() {
    // 清空现有网格元素
    gameBoard.innerHTML = '';
    
    // 创建游戏区域网格
    for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
        let block = document.createElement('div');
        block.className = 'block color0';
        gameBoard.appendChild(block);
    }
    
    // 清空并创建下一个方块预览区域
    nextPieceBoard.innerHTML = '';
    
    for (let j = 0; j < 4 * 4; j++) {  // 下一个方块预览区域使用4x4网格
        let block = document.createElement('div');
        block.className = 'block color0';
        nextPieceBoard.appendChild(block);
    }
}

// 计算方块形状的最大长度（每行最右边非0的位置的x最大值）
function calculateMaxLength(shape) {
    let maxX = 0;
    for (let y = 0; y < shape.length; y++) {
        for (let x = shape[y].length - 1; x >= 0; x--) {
            if (shape[y][x] !== 0) {
                if (x > maxX) {
                    maxX = x;
                }
                break;  // 找到该行最右边的非0元素后停止
            }
        }
    }
    // 返回最大x坐标+1（表示长度）
    return maxX + 1;
}

// 生成随机方块
function generateRandomPiece() {
    // 随机生成一个方块
    let shapeId = Math.floor(Math.random() * 7) + 1;  // 1-7 对应7种不同的方块形状
    let shape = JSON.parse(JSON.stringify(SHAPES[shapeId]));  // 深拷贝形状
    let colorId = shapeId;  // 颜色ID与形状ID对应
    let maxLength = calculateMaxLength(shape);
    
    return {
        shape: shape,
        color: colorId,
        max_length: maxLength,
        x: Math.floor(BOARD_WIDTH / 2 - maxLength / 2),
        y: 0
    };
}

// 使用下一个方块作为当前方块
function spawnNextPiece() {
    // 使用下一个方块作为当前方块
    currentPiece = nextPiece;
    // 生成新的下一个方块
    nextPiece = generateRandomPiece();
    
    // 更新下一个方块预览
    updateNextPiecePreview();
    
    // 检查游戏是否结束
    if (!isPositionValid(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        gameOver();
    }
}

// 更新下一个方块预览
function updateNextPiecePreview() {
    // 清空下一个方块预览区域
    for (let i = 0; i < 4 * 4; i++) {
        nextPieceBoard.children[i].className = 'block color0';
    }
    
    // 绘制下一个方块
    let shape = nextPiece.shape;
    let color = nextPiece.color;
    let offsetX = Math.floor((4 - shape[0].length) / 2);
    let offsetY = Math.floor((4 - shape.length) / 2);
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                let index = (y + offsetY) * 4 + (x + offsetX);
                if (index >= 0 && index < 16) {
                    nextPieceBoard.children[index].className = `block color${color}`;
                }
            }
        }
    }
}

// 更新游戏板的视觉显示
function updateBoardVisuals() {
    // 更新游戏板的视觉显示
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            let index = y * BOARD_WIDTH + x;
            gameBoard.children[index].className = `block color${board[y][x]}`;
        }
    }
    
    // 绘制当前方块
    let shape = currentPiece.shape;
    let color = currentPiece.color;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                let boardX = currentPiece.x + x;
                let boardY = currentPiece.y + y;
                if (boardX >= 0 && boardX < BOARD_WIDTH && boardY >= 0 && boardY < BOARD_HEIGHT) {
                    let index = boardY * BOARD_WIDTH + boardX;
                    gameBoard.children[index].className = `block color${color}`;
                }
            }
        }
    }
}

// 更新UI显示
function updateUI() {
    scoreDisplay.textContent = score;
    linesDisplay.textContent = lines;
    levelDisplay.textContent = level;
    updateBoardVisuals();
    updateButtonStates();
}

// 更新按钮状态
function updateButtonStates() {
    if (isGameOver) {
        startButton.disabled = true;
        pauseButton.disabled = true;
        aiModeButton.disabled = true;
    } else {
        startButton.disabled = !isPaused;
        pauseButton.disabled = isPaused;
        aiModeButton.disabled = false;
    }
    restartButton.disabled = false;
}

// 开始游戏
function startGame() {
    if (autoDropTimer) {
        clearInterval(autoDropTimer);
    }
    
    // 根据是否为AI模式设置不同的下落速度
    const dropInterval = isAiMode ? 50 : 1000;
    
    autoDropTimer = setInterval(() => {
        if (!isPaused && !isGameOver) {
            movePieceDown();
        }
    }, dropInterval);
    
    if (isAiMode && !aiMoveTimer) {
        aiMoveTimer = setInterval(() => {
            if (isAiMode && !isPaused && !isGameOver) {
                performAiMove();
            }
        }, aiMoveDelay);
    }
    
    isPaused = false;
    statusDisplay.textContent = '游戏中' + (isAiMode ? ' (AI模式)' : '');
    updateButtonStates();
}

// 暂停游戏
function pauseGame() {
    if (autoDropTimer) {
        clearInterval(autoDropTimer);
        autoDropTimer = null;
    }
    
    if (aiMoveTimer) {
        clearInterval(aiMoveTimer);
        aiMoveTimer = null;
    }
    
    isPaused = true;
    statusDisplay.textContent = '已暂停';
    updateButtonStates();
}

// 游戏结束
function gameOver() {
    if (autoDropTimer) {
        clearInterval(autoDropTimer);
        autoDropTimer = null;
    }
    
    if (aiMoveTimer) {
        clearInterval(aiMoveTimer);
        aiMoveTimer = null;
    }
    
    isGameOver = true;
    gameOverPanel.classList.remove('hidden');
    finalScoreDisplay.textContent = `最终得分: ${score}`;
    statusDisplay.textContent = '游戏结束';
    updateButtonStates();
    
    // 记录游戏结果
    recordGameResult();
}

// 向左移动方块
function movePieceLeft() {
    if (isPositionValid(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x -= 1;
        updateBoardVisuals();
        return true;
    }
    return false;
}

// 向右移动方块
function movePieceRight() {
    if (isPositionValid(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x += 1;
        updateBoardVisuals();
        return true;
    }
    return false;
}

// 向下移动方块
function movePieceDown() {
    if (isPositionValid(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y += 1;
        updateBoardVisuals();
        return true;
    } else {
        // 方块无法继续下移，固定到游戏板上
        lockPiece();
        return false;
    }
}

// 硬下落：将方块直接落到底部
function hardDrop() {
    while (movePieceDown()) {}
}

// 旋转方块
function rotatePiece() {
    let rotatedShape = [];
    let rows = currentPiece.shape.length;
    let cols = currentPiece.shape[0].length;
    
    // 初始化旋转后的形状
    for (let i = 0; i < cols; i++) {
        rotatedShape.push(new Array(rows).fill(0));
    }
    
    // 执行旋转（逆时针90度）
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotatedShape[cols - 1 - x][y] = currentPiece.shape[y][x];
        }
    }
    
    //如果左边为空，方块左移
    let x=0;
    var count_zero=rows;
    while (count_zero==rows){
        count_zero=0;
        for(let y=0;y<rows;y++){
            if (rotatedShape[y][x] == 0) {
                count_zero++;
            }
        }
        if (count_zero<rows){
            break;
        }
        for (let y = 0; y < rows; y++) {
            for (let x =1; x < cols; x++) {
                rotatedShape[y][x-1] = rotatedShape[y][x];
            }
            rotatedShape[y][cols-1] = 0;
        }
    }
    
    
    //如果下面为空，方块下移
    y=rows-1;
    var count_zero=cols;
    while (count_zero==cols){
        count_zero=0;
        for(let x=0;x<cols;x++){
            if (rotatedShape[y][x] == 0) {
                count_zero++;
            }
        }
        if (count_zero<cols){
            break;
        }
        for (let x =0; x < cols; x++) {
            for (let y = rows-1; y >=0; y--) {
                rotatedShape[y][x] = rotatedShape[y-1][x];
            }
            rotatedShape[0][x] = 0;
        }
    }
    
    // 计算旋转后的最大长度
    let maxLength = calculateMaxLength(rotatedShape);
    
    // 检查旋转后位置是否有效
    if (isPositionValid(rotatedShape, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = rotatedShape;
        currentPiece.max_length = maxLength;
        updateBoardVisuals();
        return true;
    }
    
    
    return false;
}

// 检查方块位置是否有效
function isPositionValid(shape, x, y) {
    for (let localY = 0; localY < shape.length; localY++) {
        for (let localX = 0; localX < shape[localY].length; localX++) {
            if (shape[localY][localX] !== 0) {
                let boardX = x + localX;
                let boardY = y + localY;
                
                // 检查是否超出边界
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return false;
                }
                
                // 检查是否与已有方块重叠（忽略屏幕上方的部分）
                if (boardY >= 0 && board[boardY][boardX] !== 0) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// 将当前方块固定到游戏板上
function lockPiece() {
    // 将方块放置在游戏板上
    placePieceOnBoard(board, currentPiece.shape, currentPiece.color, currentPiece.x, currentPiece.y);
    
    var linesCleared;

    // 检查并消除完整的行
    [board,linesCleared] = checkAndClearLines(board);
    
    // 更新分数和等级
    updateScoreAndLevel(linesCleared);
    
    // 生成新的方块
    spawnNextPiece();
    
    // 更新游戏板视觉显示
    updateBoardVisuals();
}

// 将方块放置在游戏板上
function placePieceOnBoard(targetBoard, shape, color, x, y) {
    for (let localY = 0; localY < shape.length; localY++) {
        for (let localX = 0; localX < shape[localY].length; localX++) {
            if (shape[localY][localX] !== 0) {
                let boardX = x + localX;
                let boardY = y + localY;
                if (boardX >= 0 && boardX < BOARD_WIDTH && boardY >= 0 && boardY < BOARD_HEIGHT) {
                    targetBoard[boardY][boardX] = color;
                }
            }
        }
    }
}

// 检查并消除完整的行
function checkAndClearLines(board2) {
    let linesCleared = 0;
    let newBoard = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let isFull = true;
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board2[y][x] === 0) {
                isFull = false;
                break;
            }
        }
        
        if (!isFull) {
            newBoard.push(board2[y].slice());
        } else {
            linesCleared++;
        }
    }
    
    // 在顶部添加新的空行
    while (newBoard.length < BOARD_HEIGHT) {
        newBoard.push(new Array(BOARD_WIDTH).fill(0));
    }
    
    // 反转数组以恢复正确的顺序
    board2 = newBoard.reverse();
    
    return [board2,linesCleared];
}

// 更新分数和等级
function updateScoreAndLevel(linesCleared) {
    // 0, 1, 2, 3, 4行对应的分数
    let linePoints = [0, 40, 100, 300, 1200];
    
    if (linesCleared > 0) {
        // 计算得分（基于等级）
        score += linePoints[Math.min(linesCleared, 4)] * level;
        lines += linesCleared;
        
        // 更新等级（每消除10行升一级）
        let newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            gameSpeed = 1.0 + (level - 1) * 0.2;
            
            // 更新自动下落速度
            if (autoDropTimer && !isPaused && !isGameOver) {
                clearInterval(autoDropTimer);
                
                // 根据是否为AI模式设置不同的下落速度
                const dropInterval = isAiMode ? 50 : 1000;
                
                autoDropTimer = setInterval(() => {
                    if (!isPaused && !isGameOver) {
                        movePieceDown();
                    }
                }, dropInterval);
            }
        }
    }
    
    // 更新UI
    updateUI();
}

// AI执行移动决策
function performAiMove() {
    if (currentPiece.y<10){
        let bestMove = findBestMove();

        // 旋转到最佳方向 - 添加旋转次数限制，防止死循环
        let rotationAttempts = 0;
        const maxRotations = 10; // 设置最大旋转尝试次数
        while (JSON.stringify(currentPiece.shape) !== JSON.stringify(bestMove.shape) && rotationAttempts < maxRotations) {
            rotatePiece();
            rotationAttempts++;
        }
        
        // 移动到最佳位置
        // 增加位置偏差检查，避免微小偏差导致的频繁移动
        for(var i=0;i<10;i++){
            if (currentPiece.x < bestMove.x) {
                movePieceRight();
            } else if (currentPiece.x > bestMove.x) {
                movePieceLeft();
            }
        }
    }
}

// 寻找最佳移动位置（考虑下一个方块）
function findBestMove() {
    let bestScore = -1000000;
    let bestPosition = {};
    
    // 尝试所有可能的旋转
    let originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
    let originalMaxLength = currentPiece.max_length;
    
    // 根据方块类型决定尝试的旋转次数
    // J形(2)、L形(3)、T形(6)：需要旋转4次才会回到原始形状
    // O形(4), I形(1)、S形(5)、Z形(7)：旋转2次就会回到原始形状
    let rotationCount = 4; // 默认旋转4次
    if ([1,4,5, 7].includes(currentPiece.color)) { // O形(4),I形(1),S形和Z形只需要旋转2次
        rotationCount = 2;
    }
    
    for (let rotation = 0; rotation < rotationCount; rotation++) {
        // 尝试所有可能的水平位置
        for (let x = 0; x <= BOARD_WIDTH - currentPiece.max_length; x++) {
            // 计算方块落到底部的位置
            let y = currentPiece.y;
            while (isPositionValid(currentPiece.shape, x, y + 1)) {
                y++;
            }
            
            // 评估这个位置的分数
            let tempBoard = copyBoard(board);
            
            // 检查在临时棋盘上放置方块是否有效
            if (isPositionValidOnTempBoard(tempBoard, currentPiece.shape, x, y)) {
                // 放置当前方块
                placePieceOnBoard(tempBoard, currentPiece.shape, currentPiece.color, x, y);
                
                // 获取当前方块放置后的评分
                let currentScore = evaluatePosition(tempBoard, x, y);
                
                // 尝试考虑下一个方块的最佳放置位置（前瞻）
                let nextPieceScore = 0;
                if (nextPiece && isAiMode) {
                    // 为下一个方块进行前瞻评估
                    nextPieceScore = evaluateNextPiece(tempBoard);
                }
                
                // 组合当前方块和下一个方块的评分（当前方块权重更高）
                let combinedScore = currentScore + nextPieceScore * 0.3; // 下一个方块的评分权重为30%
                
                // 更新最佳位置
                if (combinedScore > bestScore) {
                    bestScore = combinedScore;
                    bestPosition = {
                        shape: JSON.parse(JSON.stringify(currentPiece.shape)),
                        x: x,
                        y: y
                    };
                }
            }
        }
        
        // 旋转方块 ,找最好的位置
        rotatePiece();
    }
    
    // 恢复原始形状
    currentPiece.shape = originalShape;
    
    return bestPosition;
}

// 评估下一个方块的最佳放置位置（用于前瞻）
function evaluateNextPiece(tempBoard) {
    let bestNextScore = -1000000;
    let nextPieceCopy = JSON.parse(JSON.stringify(nextPiece));
    let originalNextShape = JSON.parse(JSON.stringify(nextPieceCopy.shape));
    
    // 根据下一个方块类型决定尝试的旋转次数
    let rotationCount = 4; // 默认旋转4次
    if ([1,4,5,7].includes(nextPieceCopy.color)) { // O形(4),I形(1),S形和Z形只需要旋转2次
        rotationCount = 2;
    }
    
    for (let rotation = 0; rotation < rotationCount; rotation++) {
        // 尝试所有可能的水平位置
        for (let x = 0; x <= BOARD_WIDTH - nextPieceCopy.max_length; x++) {
            // 计算方块落到底部的位置
            let y = 0; // 从顶部开始
            let tempBoardCopy = copyBoard(tempBoard);
            
            // 模拟下一个方块下落到底部
            while (isPositionValidOnTempBoard(tempBoardCopy, nextPieceCopy.shape, x, y + 1)) {
                y++;
            }
            
            // 检查在临时棋盘上放置下一个方块是否有效
            if (isPositionValidOnTempBoard(tempBoardCopy, nextPieceCopy.shape, x, y)) {
                // 放置下一个方块
                placePieceOnBoard(tempBoardCopy, nextPieceCopy.shape, nextPieceCopy.color, x, y);
                
                // 评估下一个方块放置后的位置分数
                let nextScore = evaluatePosition(tempBoardCopy, x, y);
                
                // 更新最佳下一个方块分数
                if (nextScore > bestNextScore) {
                    bestNextScore = nextScore;
                }
            }
        }
        
        // 旋转下一个方块（使用临时函数旋转）
        rotateTempPiece(nextPieceCopy);
    }
    
    // 恢复原始形状
    nextPieceCopy.shape = originalNextShape;
    
    return bestNextScore;
}

// 临时旋转方块（不改变游戏状态）
function rotateTempPiece(piece) {
    let shape = piece.shape;
    let rows = shape.length;
    let cols = shape[0].length;
    
    // 创建旋转后的形状
    let rotatedShape = Array(cols).fill().map(() => Array(rows).fill(0));
    
    // 执行旋转（逆时针90度）
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotatedShape[cols - 1 - x][y] = shape[y][x];
        }
    }
    
    // 如果左边为空，方块左移
    let x = 0;
    let count_zero = rows;
    while (count_zero == rows) {
        count_zero = 0;
        for (let y = 0; y < rows; y++) {
            if (rotatedShape[y][x] == 0) {
                count_zero++;
            }
        }
        if (count_zero < rows) {
            break;
        }
        for (let y = 0; y < rows; y++) {
            for (let x = 1; x < cols; x++) {
                rotatedShape[y][x - 1] = rotatedShape[y][x];
            }
            rotatedShape[y][cols - 1] = 0;
        }
    }
    
    // 如果下面为空，方块下移
    let y = rows - 1;
    count_zero = cols;
    while (count_zero == cols) {
        count_zero = 0;
        for (let x = 0; x < cols; x++) {
            if (rotatedShape[y][x] == 0) {
                count_zero++;
            }
        }
        if (count_zero < cols) {
            break;
        }
        for (let x = 0; x < cols; x++) {
            for (let y = rows - 1; y > 0; y--) {
                rotatedShape[y][x] = rotatedShape[y - 1][x];
            }
            rotatedShape[0][x] = 0;
        }
    }
    
    // 更新方块形状和最大长度
    piece.shape = rotatedShape;
    piece.max_length = calculateMaxLength(rotatedShape);
}

// 评估位置的好坏
function evaluatePosition(tempBoard,currentX,currentY) {
    // 评估位置的好坏：消除行数、堆叠高度和空洞数量
    let clearedLines = 0;
    let maxHeight = 0;  // 记录最高高度
    let holes = 0;
    let narrow = 0;  // 深沟数量
    let columnHeights = [];  // 存储每列的高度
    let weight=0;
    let roughness = 0; // 堆叠粗糙度（各列高度差异）
    let aggregateHeight = 0; // 总高度
    let wellCount = 0; // 井的数量（两边都高的沟）
    let completeLines = 0; // 完整行数
    let highestHoleX = -1; // 最高洞的x坐标
    let blocksAboveHighestHole = 0; // 最高洞上方的方块数量
    let highestHoleY = BOARD_HEIGHT; // 最高洞的y坐标（越小越接近顶部）
    
    let tempBoard2 = copyBoard(tempBoard);

    var linesCleared=0;
    // 检查并消除完整的行
    [tempBoard2,linesCleared] = checkAndClearLines(tempBoard2);
    clearedLines=linesCleared;
    completeLines=linesCleared;


    
    // 计算每列的高度和空洞数量，同时寻找最高的洞
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let columnHeight = 0;
        let hasBlock = false;
        var holes_weight=0;
        let columnHighestHoleY = BOARD_HEIGHT; // 当前列最高洞的y坐标
        
        for (let y = 0; y < BOARD_HEIGHT; y++) {

            weight+=tempBoard2[y][x]*y;

            if (tempBoard2[y][x] !== 0) {
                if (BOARD_HEIGHT - y > columnHeight){
                    columnHeight = BOARD_HEIGHT - y;
                }
                hasBlock = true;
                holes_weight+=1;
                
                // 如果当前列已经找到了最高洞，计算洞上方的方块数量
                if (columnHighestHoleY < y && highestHoleX === x) {
                    blocksAboveHighestHole++;
                }
            } else{
                if (hasBlock) {
                    holes+=1; //holes_weight; //洞口上面的积木越多，越不好
                    
                    // 找到当前列的最高洞（y值最小的洞）
                    if (y < columnHighestHoleY) {
                        columnHighestHoleY = y;
                        
                        // 更新全局最高洞
                        if (y < highestHoleY) {
                            highestHoleY = y;
                            highestHoleX = x;
                            blocksAboveHighestHole = holes_weight; // 初始化洞上方方块数量
                        }
                    }
                }
            }
        }
        
        columnHeights[x] = columnHeight;
        aggregateHeight += columnHeight;
        
        // 更新最大高度
        if (columnHeight > maxHeight) {
            maxHeight = columnHeight;
        }
    }
    
    // 计算堆叠粗糙度（相邻列高度差之和）
    for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        var d=Math.abs(columnHeights[x] - columnHeights[x+1]);
        if (d>3){
            roughness += d;
        }
    }
    
    // 计算深沟和井的数量
    for (let x = 0; x < BOARD_WIDTH; x++) {
        // 对于最左边的列，只需要判断右边的列是否比它高
        if (x === 0 && x + 1 < BOARD_WIDTH) {
            if (columnHeights[x] < columnHeights[x+1] - 1 && columnHeights[x+1] > 0) {
                narrow += columnHeights[x+1] - columnHeights[x];
                // 如果左边没有列，但右边有列且比它高2格以上，也算作井
                if (columnHeights[x] < 3 && columnHeights[x+1] > 4) {
                    wellCount += 1;
                }
            }
        }
        // 对于最右边的列，只需要判断左边的列是否比它高
        else if (x === BOARD_WIDTH - 1 && x - 1 >= 0) {
            if (columnHeights[x] < columnHeights[x-1] - 1 && columnHeights[x-1] > 0) {
                narrow += columnHeights[x-1] - columnHeights[x];
                // 如果右边没有列，但左边有列且比它高2格以上，也算作井
                if (columnHeights[x] < 3 && columnHeights[x-1] > 4) {
                    wellCount += 1;
                }
            }
        }
        // 对于中间列，判断左右两侧列是否都比它高
        else if (x > 0 && x < BOARD_WIDTH - 1) {
            if (columnHeights[x] < columnHeights[x-1] - 1 && 
                columnHeights[x] < columnHeights[x+1] - 1 && 
                columnHeights[x-1] > 0 && 
                columnHeights[x+1] > 0) {
                narrow +=  Math.max(columnHeights[x-1], columnHeights[x+1]) - columnHeights[x];
                // 如果中间列比左右两边低2格以上，且左右两边都有方块，算作井
                if (columnHeights[x] < 3 && columnHeights[x-1] > 4 && columnHeights[x+1] > 4) {
                    wellCount += 2; // 两边都高，权重更高
                }
            }
        }
    }
    
    var y_weight = 0;
    if (currentY < 10) {  // 扩大y_weight的影响范围
        y_weight = (10 - currentY);  // 改为正数，使方块位置越低得分越高
    }

    // 使用自定义评分函数或默认公式
    if (customEvaluateFunction) {
        try {
            return customEvaluateFunction(completeLines, y_weight, weight, holes, narrow, roughness, aggregateHeight, maxHeight, wellCount, highestHoleX, blocksAboveHighestHole);
        } catch (e) {
            console.error('自定义评分函数执行错误:', e);
            // 发生错误时回退到默认公式
            return calculateScore(completeLines, y_weight, weight, holes, narrow, roughness, aggregateHeight, maxHeight, wellCount, highestHoleX, blocksAboveHighestHole);
        }
    } else {
        // 优化的评分公式：优先消除行数，其次降低总高度，减少空洞和粗糙度
        return calculateScore(completeLines, y_weight, weight, holes, narrow, roughness, aggregateHeight, maxHeight, wellCount, highestHoleX, blocksAboveHighestHole);
    }
}

// 计算最终得分的辅助函数
function calculateScore(completeLines, y_weight, weight, holes, narrow, roughness, aggregateHeight, maxHeight, wellCount, highestHoleX, blocksAboveHighestHole) {
    // 优化的权重分配
    // 1. 消除行数最重要
    // 2. 其次是降低堆叠高度和避免井
    // 3. 然后是减少空洞和粗糙度
    // 4. 最后是优先将方块放在低位
    
    // 为不同行数设置不同的权重
    let lineBonus = 0;
    if (completeLines === 1) lineBonus = 100000;
    else if (completeLines === 2) lineBonus = 500000;
    else if (completeLines === 3) lineBonus = 1000000;
    else if (completeLines >= 4) lineBonus = 1500000;
    
    // 对最高洞上方方块的惩罚：上方方块越多，惩罚越严重
    let highestHolePenalty = 0;
    if (highestHoleX !== -1 && blocksAboveHighestHole > 0) {
        // 上方方块数量的平方惩罚，使惩罚增长更快
        highestHolePenalty = blocksAboveHighestHole *50000;
    }
    
    return lineBonus +
           weight * 100 -          // 底部权重
           y_weight * y_weight *2000 -       // 越高惩罚越多
           holes* holes* 40000 -         // 空洞（增加惩罚）
           narrow * 10000 -         // 深沟（增加惩罚，比空洞更严重）
           roughness * 1000 -     // 粗糙度
           aggregateHeight * 1000 - // 总高度
           maxHeight * 10000 -      // 最大高度
           wellCount * 20000 -     // 井的数量（高惩罚，避免形成深井）
           highestHolePenalty;     // 最高洞上方方块的惩罚
}

// 更新公式编辑器显示
function updateFormulaEditor() {
    const formulaInput = document.getElementById('formulaInput');
    if (formulaInput) {
        // 将calculateScore函数完整代码作为默认公式
        formulaInput.value = `// 计算最终得分的辅助函数
function calculateScore(completeLines, y_weight, weight, holes, narrow, roughness, aggregateHeight, maxHeight, wellCount) {
    // 优化的权重分配
    // 1. 消除行数最重要
    // 2. 其次是降低堆叠高度和避免井
    // 3. 然后是减少空洞和粗糙度
    // 4. 最后是优先将方块放在低位
    
    // 为不同行数设置不同的权重
    let lineBonus = 0;
    if (completeLines === 1) lineBonus = 1000;
    else if (completeLines === 2) lineBonus = 20000;
    else if (completeLines === 3) lineBonus = 80000;
    else if (completeLines >= 4) lineBonus = 90000;
    
    return lineBonus +
           y_weight * 500 +       // 方块位置（低位加分）
           weight * 10 -          // 底部权重
           holes * 2000 -         // 空洞（增加惩罚）
           narrow * 800 -         // 深沟（增加惩罚）
           roughness * 5000 -     // 粗糙度
           aggregateHeight * 200 - // 总高度
           maxHeight * 500 -      // 最大高度
           wellCount * 3000;      // 井的数量（高惩罚，避免形成深井）
}`;
    }
}


// 绑定事件监听器
function bindEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
    // 按钮事件
    startButton.addEventListener('click', () => {
        if (isGameOver) {
            initializeGame();
        }
        
        if (isPaused) {
            startGame();
        } else {
            initializeGame();
            startGame();
        }
    });
    
    pauseButton.addEventListener('click', () => {
        if (isGameOver) {
            return;
        }
        
        if (isPaused) {
            startGame();
        } else {
            pauseGame();
        }
    });
    
    aiModeButton.addEventListener('click', () => {
        isAiMode = !isAiMode;
        
        // 无论是否在游戏中，都重置定时器以确保正常工作
        if (!isGameOver) {
            if (autoDropTimer) {
                clearInterval(autoDropTimer);
                autoDropTimer = null;
            }
            
            if (aiMoveTimer) {
                clearInterval(aiMoveTimer);
                aiMoveTimer = null;
            }
            
            // 重新启动游戏，确保autoDropTimer和aiMoveTimer都被正确初始化
            startGame();
        }
    });
    
    restartButton.addEventListener('click', initializeGame);
    
    playAgainButton.addEventListener('click', () => {
        initializeGame();
    });
    
    // 添加查看记录按钮的事件监听
    if (showRecordsButton) {
        showRecordsButton.addEventListener('click', toggleGameRecords);
    }
    
    // 手机触摸控制按钮事件监听
    const btnRotate = document.querySelector('.btn-rotate');
    const btnLeft = document.querySelector('.btn-left');
    const btnRight = document.querySelector('.btn-right');
    const btnDown = document.querySelector('.btn-down');
    const btnHarddrop = document.querySelector('.btn-harddrop');
    
    if (btnRotate) {
        btnRotate.addEventListener('click', () => {
            if (!isGameOver && !isAiMode) {
                rotatePiece();
            }
        });
    }
    
    if (btnLeft) {
        btnLeft.addEventListener('click', () => {
            if (!isGameOver && !isAiMode) {
                movePieceLeft();
            }
        });
    }
    
    if (btnRight) {
        btnRight.addEventListener('click', () => {
            if (!isGameOver && !isAiMode) {
                movePieceRight();
            }
        });
    }
    
    if (btnDown) {
        btnDown.addEventListener('click', () => {
            if (!isGameOver && !isAiMode) {
                movePieceDown();
            }
        });
    }
    
    if (btnHarddrop) {
        btnHarddrop.addEventListener('click', () => {
            if (!isGameOver && !isAiMode) {
                hardDrop();
            }
        });
    }
    
    // 评分公式编辑器事件监听
    const formulaInput = document.getElementById('formulaInput');
    const applyFormulaBtn = document.getElementById('applyFormulaBtn');
    
    if (formulaInput && applyFormulaBtn) {
        applyFormulaBtn.addEventListener('click', () => {
            applyCustomFormula(formulaInput.value);
        });
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    bindEventListeners();
    
    // 从本地存储加载游戏记录
    loadRecordsFromLocalStorage();
});


// 创建游戏板的深拷贝
function copyBoard(board2) {
    const newBoard = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        newBoard.push([...board2[y]]); // 为每一行创建一个新数组
    }
    return newBoard;
}

// 检查在临时棋盘上放置方块是否有效
function isPositionValidOnTempBoard(tempBoard, shape, x, y) {
    for (let localY = 0; localY < shape.length; localY++) {
        for (let localX = 0; localX < shape[localY].length; localX++) {
            if (shape[localY][localX] !== 0) {
                let boardX = x + localX;
                let boardY = y + localY;
                
                // 检查是否超出边界
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return false;
                }
                
                // 检查是否与临时棋盘上已有方块重叠（忽略屏幕上方的部分）
                if (boardY >= 0 && tempBoard[boardY][boardX] !== 0) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// 记录游戏结果
function recordGameResult() {
    // 创建游戏记录对象
    const gameRecord = {
        score: score,
        lines: lines,
        formula: defaultFormula,
        date: new Date().toLocaleString('zh-CN')
    };
    
    // 添加记录到数组开头
    gameRecords.unshift(gameRecord);
    
    // 如果记录数量超过最大值，则删除最旧的记录
    if (gameRecords.length > MAX_RECORDS) {
        gameRecords.pop();
    }
    
    // 保存记录到本地存储
    saveRecordsToLocalStorage();
}

// 保存记录到本地存储
function saveRecordsToLocalStorage() {
    try {
        localStorage.setItem('tetrisGameRecords', JSON.stringify(gameRecords));
    } catch (e) {
        console.error('保存游戏记录失败:', e);
    }
}

// 从本地存储加载记录
function loadRecordsFromLocalStorage() {
    try {
        const storedRecords = localStorage.getItem('tetrisGameRecords');
        if (storedRecords) {
            gameRecords = JSON.parse(storedRecords);
        }
    } catch (e) {
        console.error('加载游戏记录失败:', e);
        gameRecords = [];
    }
}

// 显示游戏记录
function displayGameRecords() {
    // 清空记录列表
    recordsList.innerHTML = '';
    
    // 如果没有记录，显示提示信息
    if (gameRecords.length === 0) {
        const noRecords = document.createElement('div');
        noRecords.className = 'no-records';
        noRecords.textContent = '暂无游戏记录';
        recordsList.appendChild(noRecords);
        return;
    }
    
    // 渲染每条记录
    gameRecords.forEach((record, index) => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        // 记录序号
        const rank = document.createElement('span');
        rank.className = 'record-rank';
        rank.textContent = `${index + 1}`;
        recordItem.appendChild(rank);
        
        // 记录信息
        const recordInfo = document.createElement('div');
        recordInfo.className = 'record-info';
        
        // 分数和日期
        const recordHeader = document.createElement('div');
        recordHeader.className = 'record-header';
        
        const scoreEl = document.createElement('span');
        scoreEl.className = 'record-score';
        scoreEl.textContent = `分数: ${record.score}`;
        recordHeader.appendChild(scoreEl);
        
        const dateEl = document.createElement('span');
        dateEl.className = 'record-date';
        dateEl.textContent = record.date;
        recordHeader.appendChild(dateEl);
        
        recordInfo.appendChild(recordHeader);
        
        // 行数
        const linesEl = document.createElement('div');
        linesEl.className = 'record-lines';
        linesEl.textContent = `消除行数: ${record.lines}`;
        recordInfo.appendChild(linesEl);
        
        // 公式（显示部分内容，鼠标悬停时显示完整公式）
        const formulaEl = document.createElement('div');
        formulaEl.className = 'record-formula';
        formulaEl.textContent = `公式: ${record.formula.length > 30 ? record.formula.substring(0, 30) + '...' : record.formula}`;
        formulaEl.title = `公式: ${record.formula}`;
        recordInfo.appendChild(formulaEl);
        
        recordItem.appendChild(recordInfo);
        recordsList.appendChild(recordItem);
    });
}

// 切换游戏记录面板显示/隐藏
function toggleGameRecords() {
    gameRecordsPanel.classList.toggle('show');
    
    // 如果面板显示，则更新记录列表
    if (gameRecordsPanel.classList.contains('show')) {
        displayGameRecords();
    }
}

// 应用自定义评分公式
function applyCustomFormula(formulaText) {
    const formulaStatus = document.getElementById('formulaStatus');
    
    try {
        // 检查用户输入是否包含完整的函数定义
        if (formulaText.includes('function calculateScore')) {
            // 创建一个匿名函数，内部包含用户定义的calculateScore函数
            const functionText = `(function() {
${formulaText}
return calculateScore;
})`;
            
            // 创建一个只返回calculateScore函数的新函数
            const getCalculateScore = new Function(`return ${functionText}`)();
            customEvaluateFunction = getCalculateScore();
            
            // 验证函数
            const testScore = customEvaluateFunction(1, 1, 10, 100, 5, 2, 0, 0, 0, 0);
            if (typeof testScore !== 'number') {
                throw new Error('公式必须返回一个数值');
            }
        } else {
            // 旧格式的处理 - 仅包含函数体
            const functionText = `(function(clearedLines, y_weight, weight, holes, narrow) {
${formulaText}
})`;
            customEvaluateFunction = new Function(`return ${functionText}`)();
            
            // 验证函数
            const testScore = customEvaluateFunction(1, 10, 100, 5, 2);
            if (typeof testScore !== 'number') {
                throw new Error('公式必须返回一个数值');
            }
        }
        
        // 保存默认公式
        defaultFormula = formulaText;
        
        // 显示成功消息
        if (formulaStatus) {
            formulaStatus.textContent = '公式应用成功！';
            formulaStatus.className = 'formula-status success';
            setTimeout(() => {
                formulaStatus.className = 'formula-status';
            }, 3000);
        }
        
        console.log('自定义评分公式应用成功');
    } catch (e) {
        // 显示错误消息
        if (formulaStatus) {
            formulaStatus.textContent = `公式错误: ${e.message}`;
            formulaStatus.className = 'formula-status error';
        }
        
        console.error('自定义评分公式错误:', e);
    }
}

// 处理键盘事件
function handleKeyDown(event) {
    // 如果是AI模式或者游戏暂停或者游戏结束，则不处理键盘事件
    if (isAiMode || isPaused || isGameOver) {
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            movePieceLeft();
            break;
        case 'ArrowRight':
            movePieceRight();
            break;
        case 'ArrowDown':
            movePieceDown();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':  // 空格键
            hardDrop();
            break;
        case 'p':
        case 'P':
            if (isPaused) {
                startGame();
            } else {
                pauseGame();
            }
            break;
        case 'r':
        case 'R':
            initializeGame();
            break;
    }
}
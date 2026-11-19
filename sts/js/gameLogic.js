/** 游戏业务逻辑：打牌、抽卡、敌人回合、回合流转 */
import {gameState, cardLibrary, currentHand, setCurrentHand, dom} from './gameState.js';
import {showMessage, createFloatingText, shakeElement, updateUI, renderHand, showGameOver, setCardClickCallback} from './uiManager.js';

// 卡牌点击事件绑定
setCardClickCallback(playCard);

export function drawCards(count) {
    if (gameState.drawPileCount < count) {
        gameState.drawPileCount += gameState.discardPileCount;
        gameState.discardPileCount = 0;
    }
    const hand = [];
    const actual = Math.min(count, gameState.drawPileCount);
    for (let i = 0; i < actual; i++) {
        const rc = cardLibrary[Math.floor(Math.random() * cardLibrary.length)];
        hand.push({ ...rc, id: rc.id + '_' + i + '_' + Date.now() });
    }
    setCurrentHand(hand);
    gameState.drawPileCount -= actual;
    updateUI();
}

export function playCard(index) {
    if (!gameState.isPlayerTurn || gameState.gameOver) return;
    const card = currentHand[index];
    if (!card || gameState.player.energy < card.cost) {
        if (card) showMessage('能量不足！', 800);
        return;
    }
    gameState.player.energy -= card.cost;
    const removed = currentHand.splice(index,1);
    setCurrentHand([...currentHand]);
    gameState.discardPileCount++;

    const cardEl = dom.cardsContainer.children[index];
    if (cardEl) cardEl.classList.add('played');

    setTimeout(() => {
        if (card.damage > 0) {
            gameState.enemy.hp = Math.max(0, gameState.enemy.hp - card.damage);
            createFloatingText(dom.enemyViewport, `-${card.damage}`, 'damage');
            shakeElement(dom.enemyViewport);
            showMessage(`造成 ${card.damage} 点伤害！`, 1000);
        }
        if (card.block > 0) {
            gameState.player.block += card.block;
            createFloatingText(dom.playerViewport, `+${card.block}`, 'block');
            showMessage(`获得 ${card.block} 点护盾！`, 1000);
        }
        if (gameState.enemy.hp <= 0) {
            gameState.gameOver = true;
            updateUI();
            showGameOver(true);
            return;
        }
        updateUI();
        renderHand();
    }, 300);
    updateUI();
    renderHand();
}

export function endTurn() {
    if (!gameState.isPlayerTurn || gameState.gameOver) return;
    gameState.isPlayerTurn = false;
    gameState.player.energy = 0;
    updateUI();
    showMessage('敌人回合...', 800);
    setTimeout(() => enemyAction(), 1000);
}

export function enemyAction() {
    if (gameState.gameOver) return;
    const intent = gameState.enemy.intent;
    if (intent.type === 'attack') {
        let dmg = intent.value;
        if (gameState.player.block > 0) {
            const absorbed = Math.min(gameState.player.block, dmg);
            gameState.player.block -= absorbed;
            dmg -= absorbed;
        }
        if (dmg > 0) {
            gameState.player.hp = Math.max(0, gameState.player.hp - dmg);
            createFloatingText(dom.playerViewport, `-${dmg}`, 'damage');
            shakeElement(dom.playerViewport);
        }
        showMessage(`敌人造成 ${intent.value} 点伤害！`, 1000);
    }
    updateUI();
    if (gameState.player.hp <= 0) {
        gameState.gameOver = true;
        updateUI();
        showGameOver(false);
        return;
    }
    setTimeout(() => startNewTurn(), 1000);
}

export function startNewTurn() {
    if (gameState.gameOver) return;
    gameState.turn++;
    gameState.isPlayerTurn = true;
    gameState.player.block = 0;
    gameState.player.energy = gameState.player.maxEnergy;
    drawCards(5);
    updateEnemyIntent();
    updateUI();
    renderHand();
    showMessage(`第 ${gameState.turn} 回合 - 你的回合`, 1200);
}

export function updateEnemyIntent() {
    const intents = [
        { type:'attack', value:8 + Math.floor(Math.random()*6), icon:'🗡️', text:'攻击' },
        { type:'attack', value:11 + Math.floor(Math.random()*5), icon:'💢', text:'重击' },
        { type:'defend', value:6 + Math.floor(Math.random()*4), icon:'🛡️', text:'防御' },
        { type:'attack', value:5 + Math.floor(Math.random()*4), icon:'⚡', text:'快速攻击' }
    ];
    gameState.enemy.intent = intents[Math.floor(Math.random() * intents.length)];
}

//初始化
drawCards(5);
updateUI();
renderHand();

dom.endTurnBtn.addEventListener('click', endTurn);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.isPlayerTurn && !gameState.gameOver) endTurn();
    }
});
showMessage('战斗开始！', 2000);

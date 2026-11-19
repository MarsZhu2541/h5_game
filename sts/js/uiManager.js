/** UI管理器：消息、飘字、震动、渲染手牌、游戏结束弹窗 */
import {gameState, currentHand, dom} from './gameState.js';

let statusTimeout = null;

export function showMessage(text, duration = 1500) {
    dom.statusMessage.textContent = text;
    dom.statusMessage.style.opacity = '1';
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => { dom.statusMessage.style.opacity = '0'; }, duration);
}

export function createFloatingText(targetEl, text, type) {
    const rect = targetEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `floating-text ${type}`;
    el.textContent = text;
    el.style.left = (rect.left + rect.width/2 - 20) + 'px';
    el.style.top = (rect.top + rect.height/2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

export function shakeElement(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
}

export function updateUI() {
    dom.playerHpBar.style.width = (gameState.player.hp / gameState.player.maxHp * 100) + '%';
    dom.playerHpText.textContent = `${gameState.player.hp} / ${gameState.player.maxHp}`;
    dom.playerBlockBar.style.width = Math.min(gameState.player.block / 30 * 100, 100) + '%';
    dom.playerBlockText.textContent = `护盾: ${gameState.player.block}`;

    dom.enemyHpBar.style.width = (gameState.enemy.hp / gameState.enemy.maxHp * 100) + '%';
    dom.enemyHpText.textContent = `${gameState.enemy.hp} / ${gameState.enemy.maxHp}`;

    dom.energyValue.textContent = gameState.player.energy;
    dom.drawPileEl.textContent = gameState.drawPileCount;
    dom.discardPileEl.textContent = gameState.discardPileCount;

    dom.turnIndicator.textContent = gameState.isPlayerTurn ? '⚔️ 你的回合' : '👹 敌人回合';
    dom.intentIcon.textContent = gameState.enemy.intent.icon;
    dom.intentText.textContent = gameState.enemy.intent.text;
    dom.intentDamage.textContent = gameState.enemy.intent.value > 0 ? gameState.enemy.intent.value : '';
}

// 回调注入：点击卡牌调用playCard，由gameLogic传入
let onCardClickCallback = null;
export function setCardClickCallback(fn){
    onCardClickCallback = fn;
}

export function renderHand() {
    dom.cardsContainer.innerHTML = '';
    currentHand.forEach((card, index) => {
        const el = document.createElement('div');
        el.className = `card ${card.type}`;
        el.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${card.type === 'attack' ? '攻击' : '技能'}</div>
            <div class="card-description">${card.description}</div>
        `;
        el.addEventListener('click', ()=>{
            if(onCardClickCallback) onCardClickCallback(index);
        });
        dom.cardsContainer.appendChild(el);
    });
}

export function showGameOver(isVictory) {
    const overlay = document.createElement('div');
    overlay.className = 'game-over';
    overlay.innerHTML = `
        <h1 style="color:${isVictory?'#ffaa00':'#ff4444'}; text-shadow:0 0 40px ${isVictory?'rgba(255,170,0,0.6)':'rgba(255,68,68,0.6)'};">
            ${isVictory?'🏆 胜利！':'💀 败北...'}
        </h1>
        <p>${isVictory?'你击败了敌人！':'你倒下了...'}</p>
        <button class="restart-btn" onclick="location.reload()">🔄 重新开始</button>
    `;
    dom.gameContainer.appendChild(overlay);
}

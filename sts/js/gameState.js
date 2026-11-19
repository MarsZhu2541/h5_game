/** 全局游戏状态与卡牌库 单一职责：只存放数据 */
export const gameState = {
    player: { hp: 80, maxHp: 80, block: 0, energy: 3, maxEnergy: 3 },
    enemy: { hp: 50, maxHp: 50, intent: { type:'attack', value:11, icon:'🗡️', text:'攻击' } },
    turn: 1,
    isPlayerTurn: true,
    gameOver: false,
    drawPileCount: 5,
    discardPileCount: 0
};

export const cardLibrary = [
    { id:'strike', name:'打击', type:'attack', cost:1, description:'造成 <span class="damage-value">6</span> 点伤害', damage:6, block:0 },
    { id:'strike2', name:'打击', type:'attack', cost:1, description:'造成 <span class="damage-value">6</span> 点伤害', damage:6, block:0 },
    { id:'strike3', name:'打击', type:'attack', cost:1, description:'造成 <span class="damage-value">6</span> 点伤害', damage:6, block:0 },
    { id:'defend', name:'防御', type:'skill', cost:1, description:'获得 <span class="block-value">5</span> 点护盾', damage:0, block:5 },
    { id:'defend2', name:'防御', type:'skill', cost:1, description:'获得 <span class="block-value">5</span> 点护盾', damage:0, block:5 },
    { id:'bash', name:'重击', type:'attack', cost:2, description:'造成 <span class="damage-value">10</span> 点伤害', damage:10, block:0 },
    { id:'ironWave', name:'铁斩波', type:'attack', cost:1, description:'造成 <span class="damage-value">5</span> 点伤害，获得 <span class="block-value">5</span> 点护盾', damage:5, block:5 }
];

export let currentHand = [];
export function setCurrentHand(arr){
    currentHand = arr;
}

// DOM元素全局导出
export const dom = {
    playerHpBar: document.getElementById('player-hp-bar'),
    playerHpText: document.getElementById('player-hp-text'),
    playerBlockBar: document.getElementById('player-block-bar'),
    playerBlockText: document.getElementById('player-block-text'),
    enemyHpBar: document.getElementById('enemy-hp-bar'),
    enemyHpText: document.getElementById('enemy-hp-text'),
    energyValue: document.getElementById('energy-value'),
    cardsContainer: document.getElementById('cards-container'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    statusMessage: document.getElementById('status-message'),
    turnIndicator: document.getElementById('turn-indicator'),
    intentIcon: document.getElementById('intent-icon'),
    intentText: document.getElementById('intent-text'),
    intentDamage: document.getElementById('intent-damage'),
    drawPileEl: document.getElementById('draw-pile'),
    discardPileEl: document.getElementById('discard-pile'),
    playerViewport: document.getElementById('player-viewport'),
    enemyViewport: document.getElementById('enemy-viewport'),
    playerLoading: document.getElementById('player-loading'),
    enemyLoading: document.getElementById('enemy-loading'),
    gameContainer: document.getElementById('game-container')
};

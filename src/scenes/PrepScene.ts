export default class PrepScene extends Phaser.Scene {
    constructor() {
      super('PrepScene')
    }
  
    create() {
      const torpedoes = JSON.parse(localStorage.getItem('torpedoes') || '{"light":true,"stun":false,"blast":false}')
      
      let selected = 'light'
  
      const options = Object.entries(torpedoes)
      let y = 200
      options.forEach(([key, unlocked]) => {
        const text = this.add.text(100, y, `${key} ${unlocked ? '' : '(verrouillé)'}`, {
          fontSize: '24px',
          color: unlocked ? '#fff' : '#888'
        })
  
        if (unlocked) {
          text.setInteractive()
          text.on('pointerdown', () => {
            selected = key
            this.scene.start('GameScene', { torpedoType: selected })
          })
        }
  
        y += 40
      })
    }
  }
  
/**
 * Player model
 */
class Player {
  constructor(data = {}) {
    this.id = null;
    this.userId = null;
    this.token = null;
    this.game_id = null;
    this.workers = null;
    this.card = null;
    this.color = null;
    this.isGodMode = null;
    this.isCurrentPlayer = false;
    Object.assign(this, data);
  }
}
export default Player;

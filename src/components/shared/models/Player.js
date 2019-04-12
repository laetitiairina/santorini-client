/**
 * Player model
 */
class Player {
  constructor(data = {}) {
    this.id = null;
    this.token = null;
    this.gameId = null;
    this.workers = null;
    this.isGodMode = null;
    Object.assign(this, data);
  }
}
export default Player;
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
    this.isCurrentPlayer = data["currentPlayer"]; // TODO: look at for some reason only currentPlayer instead of isCurrentPlayer when received per REST
    Object.assign(this, data);
  }
}
export default Player;
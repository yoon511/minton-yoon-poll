export function getPlayerId() {
  const key = "yoon_badminton_player_id";
  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

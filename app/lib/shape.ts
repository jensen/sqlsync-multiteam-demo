type Point = { x: number; y: number };
type Rect = Point & { width: number; height: number };

export function insideRect(point: Point, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function outsideRect(point: Point, rect: Rect) {
  return (
    point.x < rect.x ||
    point.x > rect.x + rect.width ||
    point.y < rect.y ||
    point.y > rect.y + rect.height
  );
}

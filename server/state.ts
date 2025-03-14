import { Schema, MapSchema, type as schemaType } from '@colyseus/schema';
import { PlayerState } from '../vibe-town-dependencies/colyseus/server/schema/PlayerState';

// Represents a room/area in the office
export class Room extends Schema {
  @schemaType('string') id: string = '';

  @schemaType('string') name: string = '';

  @schemaType('number') x: number = 0;

  @schemaType('number') y: number = 0;

  @schemaType('number') width: number = 0;

  @schemaType('number') height: number = 0;

  @schemaType('string') roomType: string = '';

  @schemaType({ map: 'string' }) properties = new MapSchema<string>();

  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    roomType: string,
  ) {
    super();
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.roomType = roomType;
  }
}

// Main state for the Vibe Town application
export class VibeTownState extends Schema {
  @schemaType({ map: PlayerState }) players = new MapSchema<PlayerState>();

  @schemaType({ map: Room }) rooms = new MapSchema<Room>();

  @schemaType('number') mapWidth: number = 800;

  @schemaType('number') mapHeight: number = 800;

  @schemaType('number') lastUpdateTime: number = 0;

  constructor() {
    super();
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms() {
    // Create some default office areas based on your office layout
    const meetingRoom = new Room(
      'meeting1',
      'Main Meeting Room',
      100,
      100,
      200,
      150,
      'meeting_room',
    );
    meetingRoom.properties.set('capacity', '8');
    this.rooms.set(meetingRoom.id, meetingRoom);

    const breakRoom = new Room(
      'break1',
      'Break Area',
      400,
      400,
      150,
      150,
      'break_room',
    );
    breakRoom.properties.set('hasWaterCooler', 'true');
    this.rooms.set(breakRoom.id, breakRoom);
  }

  addPlayer(sessionId: string, x: number = 400, y: number = 400): void {
    const player = new PlayerState(sessionId);
    player.x = x; // Start at map center by default
    player.y = y;
    this.players.set(sessionId, player);
  }

  removePlayer(sessionId: string): void {
    this.players.delete(sessionId);
  }

  updatePlayerPosition(sessionId: string, x: number, y: number): void {
    const player = this.players.get(sessionId);
    if (player) {
      player.x = x;
      player.y = y;
      player.lastUpdateTime = Date.now();
    }
  }

  getPlayersInRoom(roomId: string): PlayerState[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(this.players.values()).filter((player) => 
      player.x >= room.x
      && player.x <= room.x + room.width
      && player.y >= room.y
      && player.y <= room.y + room.height,
    );
  }

  getNearbyPlayers(x: number, y: number, radius: number = 50): PlayerState[] {
    return Array.from(this.players.values()).filter((player) => {
      const dx = player.x - x;
      const dy = player.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }
}

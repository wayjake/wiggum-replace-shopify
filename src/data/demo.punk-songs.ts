export interface PunkSong {
  id: string
  name: string
  artist: string
}

const punkSongs: PunkSong[] = [
  { id: '1', name: 'Anarchy in the U.K.', artist: 'Sex Pistols' },
  { id: '2', name: 'Blitzkrieg Bop', artist: 'Ramones' },
  { id: '3', name: 'London Calling', artist: 'The Clash' },
  { id: '4', name: 'Should I Stay or Should I Go', artist: 'The Clash' },
  { id: '5', name: 'God Save the Queen', artist: 'Sex Pistols' },
  { id: '6', name: 'I Wanna Be Sedated', artist: 'Ramones' },
  { id: '7', name: 'White Riot', artist: 'The Clash' },
  { id: '8', name: 'Holiday in Cambodia', artist: 'Dead Kennedys' },
  { id: '9', name: 'California Über Alles', artist: 'Dead Kennedys' },
  { id: '10', name: 'Rock the Casbah', artist: 'The Clash' },
]

export async function getPunkSongs(): Promise<PunkSong[]> {
  // Simulate async data fetching
  return Promise.resolve(punkSongs)
}

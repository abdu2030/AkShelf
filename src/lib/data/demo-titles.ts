import { MediaCardProps } from "@/components/title/media-card";

export interface DemoEpisodeDefinition {
  episodeNumber: number;
  name: string;
  runtime?: number;
}

export interface DemoSeasonDefinition {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes: DemoEpisodeDefinition[];
}

export interface DemoTitleDefinition {
  externalSource: "tmdb" | "anilist";
  externalId: string;
  title: string;
  type: "MOVIE" | "TV" | "ANIME";
  year: number;
  overview: string;
  posterUrl: string;
  backdropUrl?: string;
  genres: string[];
  status: "WATCHED" | "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";
  rating?: number | null;
  season?: number;
  episode?: number;
  currentEpisode?: number;
  totalEpisodes?: number;
  addedAt: string;
  watchedAt?: string;
  startedAt?: string;
  seasons?: DemoSeasonDefinition[];
}

export const demoTitles: DemoTitleDefinition[] = [
  // ==========================================
  // MOVIES (9 titles)
  // ==========================================
  {
    externalSource: "tmdb",
    externalId: "27205",
    title: "Inception",
    type: "MOVIE",
    year: 2010,
    overview:
      "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.",
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    genres: ["Action", "Science Fiction", "Adventure"],
    status: "WATCHED",
    rating: 9.5,
    addedAt: "2026-01-10T14:20:00Z",
    watchedAt: "2026-01-12T22:30:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "157336",
    title: "Interstellar",
    type: "MOVIE",
    year: 2014,
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    genres: ["Adventure", "Drama", "Science Fiction"],
    status: "WATCHED",
    rating: 10.0,
    addedAt: "2026-01-15T19:00:00Z",
    watchedAt: "2026-01-16T23:15:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "155",
    title: "The Dark Knight",
    type: "MOVIE",
    year: 2008,
    overview:
      "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    genres: ["Action", "Crime", "Drama"],
    status: "WATCHED",
    rating: 9.8,
    addedAt: "2026-01-20T11:30:00Z",
    watchedAt: "2026-01-21T02:00:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "129",
    title: "Spirited Away",
    type: "MOVIE",
    year: 2001,
    overview:
      "A young girl, Chihiro, becomes trapped in a strange world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage within.",
    posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    genres: ["Animation", "Family", "Fantasy"],
    status: "WATCHED",
    rating: 9.2,
    addedAt: "2026-02-01T16:45:00Z",
    watchedAt: "2026-02-02T19:00:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "496243",
    title: "Parasite",
    type: "MOVIE",
    year: 2019,
    overview:
      "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    posterUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    genres: ["Comedy", "Thriller", "Drama"],
    status: "WATCHED",
    rating: 9.4,
    addedAt: "2026-02-10T20:10:00Z",
    watchedAt: "2026-02-11T22:45:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "693134",
    title: "Dune: Part Two",
    type: "MOVIE",
    year: 2024,
    overview:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvk8ke9mfQmrnvcrAi8qAm5.jpg",
    genres: ["Science Fiction", "Adventure"],
    status: "WATCHING",
    rating: 9.0,
    addedAt: "2026-03-05T21:00:00Z",
    startedAt: "2026-03-05T21:05:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "872585",
    title: "Oppenheimer",
    type: "MOVIE",
    year: 2023,
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genres: ["Drama", "History"],
    status: "PLAN_TO_WATCH",
    rating: null,
    addedAt: "2026-03-12T10:15:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "335984",
    title: "Blade Runner 2049",
    type: "MOVIE",
    year: 2017,
    overview:
      "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret.",
    posterUrl: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    genres: ["Science Fiction", "Mystery"],
    status: "ON_HOLD",
    rating: 8.0,
    addedAt: "2026-03-18T18:30:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "526896",
    title: "Morbius",
    type: "MOVIE",
    year: 2022,
    overview:
      "Dangerously ill with a rare blood disorder, Dr. Morbius attempts a desperate gamble that unleashes a darkness inside him.",
    posterUrl: "https://image.tmdb.org/t/p/w500/6JjfSchHsiCc0vm4E8tD0iKoo5y.jpg",
    genres: ["Action", "Science Fiction", "Fantasy"],
    status: "DROPPED",
    rating: 4.0,
    addedAt: "2026-03-25T14:00:00Z",
  },

  // ==========================================
  // TV SERIES (9 titles)
  // ==========================================
  {
    externalSource: "tmdb",
    externalId: "1396",
    title: "Breaking Bad",
    type: "TV",
    year: 2008,
    overview:
      "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
    posterUrl: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    genres: ["Drama", "Crime"],
    status: "WATCHING",
    rating: 9.8,
    season: 1,
    episode: 5,
    currentEpisode: 5,
    totalEpisodes: 7,
    addedAt: "2026-01-05T09:00:00Z",
    startedAt: "2026-01-06T10:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 7,
        episodes: [
          { episodeNumber: 1, name: "Pilot", runtime: 58 },
          { episodeNumber: 2, name: "Cat's in the Bag...", runtime: 48 },
          { episodeNumber: 3, name: "...And the Bag's in the River", runtime: 48 },
          { episodeNumber: 4, name: "Cancer Man", runtime: 48 },
          { episodeNumber: 5, name: "Gray Matter", runtime: 48 },
          { episodeNumber: 6, name: "Crazy Handful of Nothin'", runtime: 48 },
          { episodeNumber: 7, name: "A No-Rough-Stuff-Type Deal", runtime: 48 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "95557",
    title: "Severance",
    type: "TV",
    year: 2022,
    overview:
      "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    posterUrl: "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wGeW.jpg",
    genres: ["Drama", "Mystery", "Science Fiction"],
    status: "WATCHING",
    rating: 9.2,
    season: 1,
    episode: 7,
    currentEpisode: 7,
    totalEpisodes: 9,
    addedAt: "2026-01-25T17:30:00Z",
    startedAt: "2026-01-26T20:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 9,
        episodes: [
          { episodeNumber: 1, name: "Good News About Hell", runtime: 57 },
          { episodeNumber: 2, name: "Half Loop", runtime: 53 },
          { episodeNumber: 3, name: "In Perpetuity", runtime: 53 },
          { episodeNumber: 4, name: "The You You Are", runtime: 51 },
          { episodeNumber: 5, name: "The Grim Barbarity of Optics and Design", runtime: 54 },
          { episodeNumber: 6, name: "Hide and Seek", runtime: 40 },
          { episodeNumber: 7, name: "Defiant Jazz", runtime: 52 },
          { episodeNumber: 8, name: "What's for Dinner?", runtime: 45 },
          { episodeNumber: 9, name: "The We We Are", runtime: 40 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "76331",
    title: "Succession",
    type: "TV",
    year: 2018,
    overview:
      "The Roy family is known for controlling the biggest media and entertainment company in the world.",
    posterUrl: "https://image.tmdb.org/t/p/w500/7udZX0s4b8K9vGg50vGg4V9vH9.jpg",
    genres: ["Drama"],
    status: "WATCHED",
    rating: 9.6,
    season: 4,
    episode: 10,
    currentEpisode: 10,
    totalEpisodes: 10,
    addedAt: "2026-02-04T12:00:00Z",
    watchedAt: "2026-02-28T23:00:00Z",
    seasons: [
      {
        seasonNumber: 4,
        name: "Season 4",
        episodeCount: 10,
        episodes: [
          { episodeNumber: 1, name: "The Munsters", runtime: 61 },
          { episodeNumber: 2, name: "Rehearsal", runtime: 60 },
          { episodeNumber: 3, name: "Connor's Wedding", runtime: 62 },
          { episodeNumber: 4, name: "Honeymoon States", runtime: 60 },
          { episodeNumber: 5, name: "Kill List", runtime: 64 },
          { episodeNumber: 6, name: "Living+", runtime: 61 },
          { episodeNumber: 7, name: "Tailgate Party", runtime: 61 },
          { episodeNumber: 8, name: "America Decides", runtime: 67 },
          { episodeNumber: 9, name: "Church and State", runtime: 73 },
          { episodeNumber: 10, name: "With Open Eyes", runtime: 88 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "100088",
    title: "The Last of Us",
    type: "TV",
    year: 2023,
    overview:
      "Twenty years after modern civilization has been destroyed, Joel is hired to smuggle Ellie out of an oppressive quarantine zone.",
    posterUrl: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7J9ZeP.jpg",
    genres: ["Drama", "Action & Adventure", "Sci-Fi & Fantasy"],
    status: "WATCHED",
    rating: 8.9,
    season: 1,
    episode: 9,
    currentEpisode: 9,
    totalEpisodes: 9,
    addedAt: "2026-02-18T15:20:00Z",
    watchedAt: "2026-02-25T21:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 9,
        episodes: [
          { episodeNumber: 1, name: "When You're Lost in the Darkness", runtime: 81 },
          { episodeNumber: 2, name: "Infected", runtime: 53 },
          { episodeNumber: 3, name: "Long, Long Time", runtime: 75 },
          { episodeNumber: 4, name: "Please Hold to My Hand", runtime: 45 },
          { episodeNumber: 5, name: "Endure and Survive", runtime: 59 },
          { episodeNumber: 6, name: "Kin", runtime: 59 },
          { episodeNumber: 7, name: "Left Behind", runtime: 56 },
          { episodeNumber: 8, name: "When We Are in Need", runtime: 51 },
          { episodeNumber: 9, name: "Look for the Light", runtime: 43 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "94605",
    title: "Arcane",
    type: "TV",
    year: 2021,
    overview:
      "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and convictions.",
    posterUrl: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn396mlXAwNtL.jpg",
    genres: ["Animation", "Sci-Fi & Fantasy", "Action & Adventure"],
    status: "WATCHED",
    rating: 9.7,
    season: 1,
    episode: 9,
    currentEpisode: 9,
    totalEpisodes: 9,
    addedAt: "2026-02-22T20:00:00Z",
    watchedAt: "2026-02-24T23:30:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 9,
        episodes: [
          { episodeNumber: 1, name: "Welcome to the Playground", runtime: 43 },
          { episodeNumber: 2, name: "Some Mysteries Are Better Left Unsolved", runtime: 44 },
          { episodeNumber: 3, name: "The Base Violence Necessary for Change", runtime: 44 },
          { episodeNumber: 4, name: "Happy Progress Day!", runtime: 41 },
          { episodeNumber: 5, name: "Everybody Wants to Be My Enemy", runtime: 40 },
          { episodeNumber: 6, name: "When These Walls Come Tumbling Down", runtime: 42 },
          { episodeNumber: 7, name: "The Boy Saviour", runtime: 40 },
          { episodeNumber: 8, name: "Oil and Water", runtime: 40 },
          { episodeNumber: 9, name: "The Monster You Created", runtime: 41 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "126308",
    title: "Shōgun",
    type: "TV",
    year: 2024,
    overview:
      "In Japan in the year 1600, Lord Yoshii Toranaga is fighting for his life as his enemies on the Council of Regents unite against him.",
    posterUrl: "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSPxv12io7pmOTh4.jpg",
    genres: ["Drama", "War & Politics"],
    status: "WATCHING",
    rating: 9.3,
    season: 1,
    episode: 6,
    currentEpisode: 6,
    totalEpisodes: 10,
    addedAt: "2026-03-01T19:40:00Z",
    startedAt: "2026-03-02T20:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 10,
        episodes: [
          { episodeNumber: 1, name: "Anjin", runtime: 70 },
          { episodeNumber: 2, name: "Servants of Two Masters", runtime: 59 },
          { episodeNumber: 3, name: "Tomorrow Is Tomorrow", runtime: 57 },
          { episodeNumber: 4, name: "The Eightfold Fence", runtime: 61 },
          { episodeNumber: 5, name: "Broken to the Fist", runtime: 58 },
          { episodeNumber: 6, name: "Ladies of the Willow World", runtime: 55 },
          { episodeNumber: 7, name: "A Stick of Time", runtime: 58 },
          { episodeNumber: 8, name: "The Abyss of Life", runtime: 56 },
          { episodeNumber: 9, name: "Crimson Sky", runtime: 60 },
          { episodeNumber: 10, name: "A Dream of a Dream", runtime: 63 },
        ],
      },
    ],
  },
  {
    externalSource: "tmdb",
    externalId: "66732",
    title: "Stranger Things",
    type: "TV",
    year: 2016,
    overview:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    posterUrl: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    genres: ["Drama", "Sci-Fi & Fantasy", "Mystery"],
    status: "ON_HOLD",
    rating: 8.2,
    season: 4,
    episode: 4,
    currentEpisode: 4,
    totalEpisodes: 9,
    addedAt: "2026-03-10T16:15:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "1399",
    title: "Game of Thrones",
    type: "TV",
    year: 2011,
    overview:
      "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.",
    posterUrl: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    genres: ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
    status: "DROPPED",
    rating: 6.0,
    season: 8,
    episode: 3,
    currentEpisode: 3,
    totalEpisodes: 6,
    addedAt: "2026-03-15T11:00:00Z",
  },
  {
    externalSource: "tmdb",
    externalId: "106379",
    title: "Fallout",
    type: "TV",
    year: 2024,
    overview:
      "The story of haves and have-nots in a world in which there's almost nothing left to have. 200 years after the apocalypse, gentle denizens of luxury fallout shelters return.",
    posterUrl: "https://image.tmdb.org/t/p/w500/AnsSKR99F0CcZihAlIl3AH8RQI.jpg",
    genres: ["Action & Adventure", "Sci-Fi & Fantasy"],
    status: "PLAN_TO_WATCH",
    rating: null,
    totalEpisodes: 8,
    addedAt: "2026-03-28T13:25:00Z",
  },

  // ==========================================
  // ANIME (10 titles)
  // ==========================================
  {
    externalSource: "anilist",
    externalId: "16498",
    title: "Attack on Titan",
    type: "ANIME",
    year: 2013,
    overview: "Humanity was almost wiped out by monstrous humanoid creatures called Titans.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73peebRJWhFw.jpg",
    genres: ["Action", "Fantasy", "Drama"],
    status: "WATCHED",
    rating: 9.5,
    season: 1,
    episode: 25,
    currentEpisode: 25,
    totalEpisodes: 25,
    addedAt: "2026-01-02T10:00:00Z",
    watchedAt: "2026-01-20T21:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 25,
        episodes: [
          { episodeNumber: 1, name: "To You, in 2000 Years", runtime: 24 },
          { episodeNumber: 2, name: "That Day", runtime: 24 },
          { episodeNumber: 3, name: "A Dim Light Amid Despair", runtime: 24 },
          { episodeNumber: 4, name: "The Night of the Closing Ceremony", runtime: 24 },
          { episodeNumber: 5, name: "First Battle", runtime: 24 },
        ],
      },
    ],
  },
  {
    externalSource: "anilist",
    externalId: "154587",
    title: "Frieren: Beyond Journey's End",
    type: "ANIME",
    year: 2023,
    overview:
      "The adventure is over, but life goes on for an elf mage just beginning to learn what living is all about.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n2b4b4b4.jpg",
    genres: ["Adventure", "Drama", "Fantasy"],
    status: "WATCHED",
    rating: 9.7,
    season: 1,
    episode: 28,
    currentEpisode: 28,
    totalEpisodes: 28,
    addedAt: "2026-01-28T14:10:00Z",
    watchedAt: "2026-02-15T22:00:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 28,
        episodes: [
          { episodeNumber: 1, name: "The Journey's End", runtime: 24 },
          { episodeNumber: 2, name: "It Didn't Have to Be Magic...", runtime: 24 },
          { episodeNumber: 3, name: "Killing Magic", runtime: 24 },
          { episodeNumber: 4, name: "The Land Where Souls Rest", runtime: 24 },
        ],
      },
    ],
  },
  {
    externalSource: "anilist",
    externalId: "5114",
    title: "Fullmetal Alchemist: Brotherhood",
    type: "ANIME",
    year: 2009,
    overview:
      "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes horribly wrong.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1TqkW34zmsXp.jpg",
    genres: ["Action", "Adventure", "Drama", "Fantasy"],
    status: "WATCHED",
    rating: 9.6,
    season: 1,
    episode: 64,
    currentEpisode: 64,
    totalEpisodes: 64,
    addedAt: "2026-02-08T18:00:00Z",
    watchedAt: "2026-03-01T20:45:00Z",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 64,
        episodes: [
          { episodeNumber: 1, name: "Fullmetal Alchemist", runtime: 24 },
          { episodeNumber: 2, name: "The First Day", runtime: 24 },
          { episodeNumber: 3, name: "City of Heresy", runtime: 24 },
        ],
      },
    ],
  },
  {
    externalSource: "anilist",
    externalId: "9253",
    title: "Steins;Gate",
    type: "ANIME",
    year: 2011,
    overview:
      "A self-proclaimed mad scientist discovers the means of sending text messages to the past, altering the present.",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-12345.jpg",
    genres: ["Drama", "Sci-Fi", "Thriller"],
    status: "WATCHED",
    rating: 9.4,
    season: 1,
    episode: 24,
    currentEpisode: 24,
    totalEpisodes: 24,
    addedAt: "2026-02-14T21:30:00Z",
    watchedAt: "2026-02-20T23:50:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "113415",
    title: "Jujutsu Kaisen",
    type: "ANIME",
    year: 2020,
    overview:
      "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself to exorcise cursed spirits.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pUbAw8.jpg",
    genres: ["Action", "Supernatural", "Fantasy"],
    status: "WATCHING",
    rating: 8.9,
    season: 2,
    episode: 14,
    currentEpisode: 14,
    totalEpisodes: 23,
    addedAt: "2026-02-26T17:00:00Z",
    startedAt: "2026-02-27T18:00:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "101922",
    title: "Demon Slayer: Kimetsu no Yaiba",
    type: "ANIME",
    year: 2019,
    overview:
      "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTDYxZaq.jpg",
    genres: ["Action", "Fantasy", "Supernatural"],
    status: "WATCHING",
    rating: 8.7,
    season: 3,
    episode: 8,
    currentEpisode: 8,
    totalEpisodes: 11,
    addedAt: "2026-03-02T15:45:00Z",
    startedAt: "2026-03-03T19:00:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "127230",
    title: "Chainsaw Man",
    type: "ANIME",
    year: 2022,
    overview:
      "Denji is a teenage boy living with a Chainsaw Devil named Pochita who is resurrected as a devil-human hybrid.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FloXvT8Z83iM.png",
    genres: ["Action", "Supernatural", "Dark Fantasy"],
    status: "WATCHED",
    rating: 8.6,
    season: 1,
    episode: 12,
    currentEpisode: 12,
    totalEpisodes: 12,
    addedAt: "2026-03-08T19:20:00Z",
    watchedAt: "2026-03-10T22:30:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "101348",
    title: "Vinland Saga",
    type: "ANIME",
    year: 2019,
    overview:
      "Young Thorfinn grew up listening to the stories of old sailors that had traveled the ocean and reached the place of legend, Vinland.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-kxWfC0w0q6gY.jpg",
    genres: ["Action", "Adventure", "Drama", "Historical"],
    status: "ON_HOLD",
    rating: 8.8,
    season: 2,
    episode: 10,
    currentEpisode: 10,
    totalEpisodes: 24,
    addedAt: "2026-03-16T12:50:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "101759",
    title: "The Promised Neverland",
    type: "ANIME",
    year: 2019,
    overview:
      "Orphans at Grace Field House discover the dark truth behind their idyllic upbringing and plot a daring escape.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101759-6eO4eC4o4.jpg",
    genres: ["Mystery", "Psychological", "Sci-Fi", "Thriller"],
    status: "DROPPED",
    rating: 5.5,
    season: 2,
    episode: 4,
    currentEpisode: 4,
    totalEpisodes: 11,
    addedAt: "2026-03-22T22:10:00Z",
  },
  {
    externalSource: "anilist",
    externalId: "151807",
    title: "Solo Leveling",
    type: "ANIME",
    year: 2024,
    overview:
      "Known as the 'Weakest Hunter of All Mankind', Sung Jinwoo finds himself in a mysterious double dungeon.",
    posterUrl:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1b4b4b4.jpg",
    genres: ["Action", "Fantasy", "Adventure"],
    status: "PLAN_TO_WATCH",
    rating: null,
    totalEpisodes: 12,
    addedAt: "2026-03-30T09:15:00Z",
  },
];

/**
 * Normalized MediaCardProps array for direct consumption by library views.
 */
export const demoLibraryItems: MediaCardProps[] = demoTitles.map((item) => ({
  id: `demo-${item.externalSource}-${item.externalId}`,
  title: item.title,
  mediaType: item.type,
  year: item.year,
  posterUrl: item.posterUrl,
  status: item.status,
  rating: item.rating,
  season: item.season,
  episode: item.episode,
  currentEpisode: item.currentEpisode,
  totalEpisodes: item.totalEpisodes,
  addedAt: item.addedAt,
}));

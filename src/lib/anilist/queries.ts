/**
 * AniList GraphQL query documents for anime search and details.
 */

export const SEARCH_ANIME_QUERY = /* GraphQL */ `
  query SearchAnime($search: String, $page: Int = 1, $perPage: Int = 20) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(search: $search, type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        description(asHtml: false)
        format
        status
        episodes
        duration
        seasonYear
        season
        startDate {
          year
          month
          day
        }
        genres
        averageScore
        popularity
      }
    }
  }
`;

export const ANIME_DETAILS_QUERY = /* GraphQL */ `
  query GetAnimeDetails($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description(asHtml: false)
      format
      status
      episodes
      duration
      seasonYear
      season
      startDate {
        year
        month
        day
      }
      genres
      averageScore
      popularity
      studios(isMain: true) {
        nodes {
          id
          name
        }
      }
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
    }
  }
`;

export const ANIME_BY_MAL_ID_QUERY = /* GraphQL */ `
  query GetAnimeByMalId($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      description(asHtml: false)
      format
      status
      episodes
      duration
      seasonYear
      season
      genres
      averageScore
    }
  }
`;

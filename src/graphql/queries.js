/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getHyperlink = /* GraphQL */ `
  query GetHyperlink($id: ID!) {
    getHyperlink(id: $id) {
      id
      title
      url
      visited
      createdOn
      owner
    }
  }
`;
export const listHyperlinks = /* GraphQL */ `
  query ListHyperlinks(
    $filter: ModelHyperlinkFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHyperlinks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        url
        visited
        createdOn
        owner
      }
      nextToken
    }
  }
`;

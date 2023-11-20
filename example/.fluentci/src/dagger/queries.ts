import { gql } from "../../deps.ts";

export const build = gql`
  query build($src: String!) {
    build(src: $src)
  }
`;

export const deploy = gql`
  query deploy(
    $src: String!
    $cachePath: String
    $cacheKey: String
    $authToken: String!
  ) {
    deploy(
      src: $src
      cachePath: $cachePath
      cacheKey: $cacheKey
      authToken: $authToken
    )
  }
`;

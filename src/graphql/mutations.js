/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createHyperlink = /* GraphQL */ `
  mutation CreateHyperlink(
    $input: CreateHyperlinkInput!
    $condition: ModelHyperlinkConditionInput
  ) {
    createHyperlink(input: $input, condition: $condition) {
      id
      title
      url
      visited
      createdOn
      owner
    }
  }
`;
export const updateHyperlink = /* GraphQL */ `
  mutation UpdateHyperlink(
    $input: UpdateHyperlinkInput!
    $condition: ModelHyperlinkConditionInput
  ) {
    updateHyperlink(input: $input, condition: $condition) {
      id
      title
      url
      visited
      createdOn
      owner
    }
  }
`;
export const deleteHyperlink = /* GraphQL */ `
  mutation DeleteHyperlink(
    $input: DeleteHyperlinkInput!
    $condition: ModelHyperlinkConditionInput
  ) {
    deleteHyperlink(input: $input, condition: $condition) {
      id
      title
      url
      visited
      createdOn
      owner
    }
  }
`;

import {
  SuiObjectResponse,
  SuiMoveObject,
  SuiObjectData,
} from '@mysten/sui.js';

export const camelCase = (string: string) =>
  string.replace(/(_\w)/g, (g) => g[1].toUpperCase());

export const parseObjectDataResponse = (
  response: SuiObjectResponse | undefined,
) => ((response?.data as SuiObjectData)?.content as SuiMoveObject)?.fields;

export const parseRegistryResponse = (
  response: SuiObjectResponse | undefined,
): any => {
  const fields = parseObjectDataResponse(response)?.value?.fields || {};
  const data = fields.data?.fields.id.id || {};
  return Object.fromEntries(
    Object.entries({ ...fields, data }).map(([key, val]) => [
      camelCase(key),
      val,
    ]),
  );
};

import {
  SuiObjectResponse,
  SuiMoveObject,
  SuiObjectData,
  normalizeSuiAddress,
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

  const object = Object.fromEntries(
    Object.entries({ ...fields }).map(([key, val]) => [camelCase(key), val]),
  );

  object.id = response?.data?.objectId;

  delete object.data;

  const data = (fields.data?.fields.contents || []).reduce(
    (acc: Record<string, any>, c: Record<string, any>) => {
      const key = c.fields.key;
      const value = c.fields.value;

      return {
        ...acc,
        [key]:
          c.type.includes('Address') || key === 'addr'
            ? normalizeSuiAddress(value)
            : value,
      };
    },
    {},
  );

  return { ...object, ...data };
};

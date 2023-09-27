export const ContractTypeArray = ["contract"];

export const BytesTypesArray = [
    'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
    'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
    'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
    'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32',
    'bytes', 'bytes memory'
] as const;

export const UintTypesArray = [
    'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256', 'uint112', 'uint24', 'uint160'
] as const;

export const IntTypesArray = ['int8', 'int16', 'int24', 'int32', 'int64', 'int128', 'int256'] as const;

export const AddressTypesArray = ['address'] as const;

export const BoolTypesArray = ['bool'] as const;

export const StringTypesArray = ['string', 'string memory'] as const;

export const GlobalStateVariableTypeArray = [
    ...ContractTypeArray, ...BytesTypesArray, ...UintTypesArray, ...IntTypesArray, ...AddressTypesArray, ...BoolTypesArray, ...StringTypesArray
] as const;

export type GlobalStateVariableType = typeof GlobalStateVariableTypeArray[number]; 

export type ContractType = typeof ContractTypeArray[number];

export type BytesTypes = typeof BytesTypesArray[number];

export type UintTypes = typeof UintTypesArray[number];

export type IntTypes = typeof IntTypesArray[number];

export type AddressTypes = typeof AddressTypesArray[number];

export type BoolTypes = typeof BoolTypesArray[number];

export type StringTypes = typeof StringTypesArray[number];
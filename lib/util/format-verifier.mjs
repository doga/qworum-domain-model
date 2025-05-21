const
isObject = o => typeof o === 'object' && !(o instanceof Array || o === null );

export default {isObject};
export {isObject};

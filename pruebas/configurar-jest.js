// Configuracion comun de jest-expo (D-26): Reanimated corre sin motor nativo con su resolutor de Jest.
require('react-native-reanimated').setUpTests();
process.env.EXPO_PUBLIC_URL_API ??= 'http://api.prueba/api/v1';

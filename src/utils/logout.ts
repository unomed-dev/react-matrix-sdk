import { MatrixClient } from 'matrix-js-sdk';
import { clearCredentials } from '../auth/credentials';


// Stops the client, logs out and clears any used stores
// Redirecting after logout (e.g. to a login page) is the
// responsibility of the caller
const logout = async (mx?: MatrixClient) => {
  try {
    await mx?.logout(true);
    await mx?.clearStores();
  } catch {
    // just continue even if logout failed
  }
  clearCredentials();
};

export default logout;

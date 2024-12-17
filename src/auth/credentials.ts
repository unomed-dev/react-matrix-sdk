/*
 * Copyright 2024 Unomed AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const getCredentials = () => {
  const accessToken = localStorage.getItem('mx_access_token');
  const userId = localStorage.getItem('mx_user_id');
  const deviceId = localStorage.getItem('mx_device_id');
  return [accessToken, userId, deviceId];
};

const storeCredentials = (payload: {
  access_token: string,
  user_id: string,
  device_id: string
}) => {
  localStorage.setItem('mx_access_token', payload.access_token);
  localStorage.setItem('mx_user_id', payload.user_id);
  localStorage.setItem('mx_device_id', payload.device_id);
};

const clearCredentials = () => {
  localStorage.removeItem('mx_access_token');
  localStorage.removeItem('mx_user_id');
  localStorage.removeItem('mx_device_id');
};

export {
  getCredentials,
  storeCredentials,
  clearCredentials,
};

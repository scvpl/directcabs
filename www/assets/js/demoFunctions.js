/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
"use strict";

/**
 * All this stuff is moved into global namespace and separate files just to be
 * MAXIMUM clear and easy to understand
 */

var client;
window.init = function(token) {
  client = new ApiAi.ApiAiClient({accessToken: 'bb1ae4c1d1454d8b8cb5f0f1032f3f72'});
  console.log(client)
};

function sendText(text) {
  console.log('req msg'+text)
  console.log(client)
  
  return client.textRequest(text);
}

// Polygol Desktop Actions
(function() {
    window.ActionsAPI = {
        /**
         * Registers a Desktop Action that this app can handle.
         * @param {object} action { id, label, description, icon, handlerEvent }
         */
        register: function(action) {
            if (window.self !== window.top) {
                window.parent.postMessage({ 
                    type: 'actions-api-request', 
                    method: 'register', 
                    payload: action 
                }, '*');
            }
        },

        /**
         * Gets a list of all registered Actions across all apps.
         * @returns {Promise<Array>}
         */
        list: function() {
            return new Promise((resolve) => {
                if (window.self === window.top) return resolve([]);
                
                const reqId = 'req_' + Date.now() + '_' + Math.random();
                const listener = (e) => {
                    if (e.source !== window.parent) return;
                    if (e.data.type === 'actions-api-response' && e.data.reqId === reqId) {
                        window.removeEventListener('message', listener);
                        resolve(e.data.payload || []);
                    }
                };
                window.addEventListener('message', listener);
                
                window.parent.postMessage({ 
                    type: 'actions-api-request', 
                    method: 'list', 
                    reqId: reqId 
                }, '*');
            });
        },

        /**
         * Dispatches files to the system's script engine.
         * @param {string} actionId 
         * @param {Array<File>} filesArray 
         */
        run: function(actionId, filesArray) {
            if (window.self !== window.top) {
                // We send a direct request to the host to run a system action
                window.parent.postMessage({ 
                    type: 'actions-api-request', 
                    method: 'run-system-action', 
                    actionId: actionId, 
                    files: filesArray 
                }, '*');
            }
        }
    };
})();
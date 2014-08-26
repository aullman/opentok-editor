(function () {
  // Turns the Array of operation Objects into an Array of JSON stringifyable objects
  var serialiseOps = function (operations) {
    return operations.map(function (op) {
      return {
        operation: op.wrapped.toJSON()
      };
    });
  };

  // Turns the JSON form of the Array of operations into ot.TextOperations
  var deserialiseOps = function (operations) {
    return operations.map(function (op) {
      return new ot.WrappedOperation(
              ot.TextOperation.fromJSON(op.operation),
              op.cursor && ot.Cursor.fromJSON(op.cursor)
            );
    });
  };

  angular.module('opentok-editor', ['opentok'])
  .directive('otEditor', ['OTSession', '$window', function (OTSession, $window) {
    return {
      restrict: 'E',
      scope: {
          modes: '='
      },
      template: '<div class="opentok-editor-mode-select" ng-show="!connecting">' +
        '<select ng-model="selectedMode" name="modes" ng-options="mode.name for mode in modes"></select>' +
        '</div>' +
        '<div ng-if="connecting" class="opentok-editor-connecting">Connecting...</div>' +
        '<div ng-show="!connecting"><div class="opentok-editor"></div></div>',
      link: function (scope, element, attrs) {
        var opentokEditor = element.context.querySelector('div.opentok-editor'),
            modeSelect = element.context.querySelector('select'),
            myCodeMirror,
            cmClient,
            doc,
            initialised = false,
            session = OTSession.session,
            otAdapter;
        scope.connecting = true;
        var selectedMode = scope.modes.filter(function (value) {return value.value === attrs.mode;});
        scope.selectedMode = selectedMode.length > 0 ? selectedMode[0] : scope.modes[0];

        var createEditorClient = function(revision, clients, doc, operations) {
            if (!cmClient) {
              otAdapter =  new OpenTokAdapter(session, revision, doc, operations);
              otAdapter.registerCallbacks('operation', function () {
                scope.$emit('otEditorUpdate');
              });
              cmClient = new ot.EditorClient(
                revision,
                clients,
                otAdapter,
                new ot.CodeMirrorAdapter(myCodeMirror)
              );
              scope.$apply(function () {
                scope.connecting = false;
                setTimeout(function () {
                  myCodeMirror.refresh();
                }, 1000);
              });
            }
        };
      
        var initialiseDoc = function () {
          if (myCodeMirror && !initialised) {
            initialised = true;
            if (myCodeMirror.getValue() !== doc.str) {
              myCodeMirror.setValue(doc.str);
              scope.$emit('otEditorUpdate');
            }
            createEditorClient(doc.revision, doc.clients, doc.str, deserialiseOps(doc.operations));
          }
        };
      
        var signalDocState = function (to) {
          var operations = otAdapter && otAdapter.operations ? serialiseOps(otAdapter.operations): [];
          // We only want the most recent 50 because we can't send too much data
          if (operations.length > 50) {
            operations = operations.slice(operations.length - 50);
          }
          var signal = {
            type: 'opentok-editor-doc',
            data: JSON.stringify({
              revision: cmClient.revision,
              clients: [],
              str: myCodeMirror.getValue(),
              operations: operations
            })
          };
          if (to) {
            signal.to = to;
          }
          session.signal(signal);
        };

        var sessionConnected = function () {
          myCodeMirror = CodeMirror(opentokEditor, attrs);
          session.signal({
            type: 'opentok-editor-request-doc'
          });

          setTimeout(function () {
              // We wait 2 seconds for other clients to send us the doc before
              // initialising it to empty
              if (!initialised) {
                initialised = true;
                createEditorClient(0, [], myCodeMirror.getValue());
                // Tell anyone that joined after us that we are initialising it
                signalDocState();
              }
          }, 10000);
        };

        session.on({
          sessionConnected: function (event) {
            sessionConnected();
          },
          'signal:opentok-editor-request-doc': function (event) {
            if (cmClient && event.from.connectionId !== session.connection.connectionId) {
              signalDocState(event.from);
            }
          },
          'signal:opentok-editor-doc': function (event) {
            doc = JSON.parse(event.data);
            initialiseDoc();
          }
        });
      
        if (session.isConnected()) {
          sessionConnected();
        }
      
        scope.$watch('selectedMode', function () {
          if (myCodeMirror) {
            myCodeMirror.setOption("mode", scope.selectedMode.value);
          }
        });
      
        scope.$on('otEditorRefresh', function () {
          myCodeMirror.refresh();
        });
      }
    };
  }]);
  
})();
var OpenTokAdapter = (function () {
  'use strict';

  function OpenTokAdapter (session, revision, doc, operations) {
    OT.$.eventing(this);
    this.registerCallbacks = this.on;
    this.session = session;

    if (operations && revision > operations.length) {
      // the operations have been truncated fill in the beginning with empty space
      var filler = [];
      filler[revision - operations.length - 1] = null;
      this.operations = filler.concat(operations);
    } else {
      this.operations = operations ? operations : [];
    }
    // We pretend to be a server
    var server = new ot.Server(doc, this.operations);
    
    this.session.on({
      connectionDestroyed: function (event) {
        this.trigger('client_left', event.connection.connectionId);
      },
      connectionCreated: function (event) {
        if (event.connection.data && event.connection.data.name) {
          this.trigger('set_name', event.connection.connectionId, event.connection.data.name);
        }
      },
      'signal:opentok-editor-operation': function (event) {
        var data = JSON.parse(event.data),
          wrapped;
          wrapped = new ot.WrappedOperation(
            ot.TextOperation.fromJSON(data.operation),
            data.cursor && ot.Cursor.fromJSON(data.cursor)
          );
          // Might need to try catch here and if it fails wait a little while and
          // try again. This way if we receive operations out of order we might
          // be able to recover
          var wrappedPrime = server.receiveOperation(data.revision, wrapped);
          console.log("new operation: " + wrapped);
          if (event.from.connectionId === session.connection.connectionId) {
            this.trigger('ack');
          } else {
            this.trigger('operation', wrappedPrime.wrapped.toJSON());
            this.trigger('cursor', event.from.connectionId, wrappedPrime.meta);
          }
      },
      'signal:opentok-editor-cursor': function (event) {
        var cursor = JSON.parse(event.data);
        this.trigger('cursor', event.from.connectionId, cursor);
      }
    }, this);
  }

  OpenTokAdapter.prototype.sendOperation = function (revision, operation, cursor) {
    this.session.signal({
      type: 'opentok-editor-operation', 
      data: JSON.stringify({
        revision: revision,
        operation: operation,
        cursor: cursor
      })
    }, (function (err) {
      if (err) console.error('Error sending operation', err);
    }).bind(this));
  };

  OpenTokAdapter.prototype.sendCursor = function (cursor) {
    this.session.signal({
      type: 'opentok-editor-cursor',
      data: JSON.stringify(cursor)
    });
  };

  return OpenTokAdapter;

}());
var OpenTokAdapter = (function () {
  'use strict';

  function OpenTokAdapter (session) {
    OT.$.eventing(this);
    this.registerCallbacks = this.on;
    this.session = session;
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
        if (event.from.connectionId === this.session.connection.connectionId) return;
        var data = JSON.parse(event.data);
        this.trigger('operation', data.operation);
        this.trigger('cursor', event.from.connectionId, data.cursor);
      },
      'signal:opentok-editor-cursor': function (event) {
        if (event.from.connectionId === this.session.connection.connectionId) return;
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
      if (!err) {
        this.trigger('ack');
      }
    }).bind(this));
  };

  OpenTokAdapter.prototype.sendCursor = function (cursor) {
    this.session.signal({
      type: 'cursor',
      data: JSON.stringify(cursor)
    });
  };

  return OpenTokAdapter;

}());
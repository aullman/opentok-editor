describe('OpenTokAdapter', function () {
  describe('constructor', function () {
    var session,
      adapter;
    beforeEach(function () {
      session = jasmine.createSpyObj('session', ['on', 'signal']);
      adapter = new OpenTokAdapter(session, 1, 'foo', []);
    });
    it('adds event listeners to the session', function () {
      expect(session.on).toHaveBeenCalled();
    });

    it('has the right properties', function () {
      expect(adapter.registerCallbacks).toBeDefined();
      expect(adapter.sendOperation).toBeDefined();
      expect(adapter.sendSelection).toBeDefined();
      expect(adapter.trigger).toBeDefined();
    });

    it('operations.length is always equal to the revision number', function () {
      expect(adapter.operations.length).toEqual(1);
      adapter = new OpenTokAdapter(session, 55, 'foo', [1,2,3,4]);
      expect(adapter.operations.length).toEqual(55);
      expect(adapter.operations.slice(adapter.operations.length-4)).toEqual([1,2,3,4]);
      adapter = new OpenTokAdapter(session, 4, 'foo', [1,2,3,4]);
      expect(adapter.operations.length).toEqual(4);
      expect(adapter.operations.slice(adapter.operations.length-4)).toEqual([1,2,3,4]);
    });
  });

  describe('sendOperation', function () {
    var session,
      adapter;
    beforeEach(function () {
      session = jasmine.createSpyObj('session', ['on', 'signal']);
      adapter = new OpenTokAdapter(session, 1, 'foo', []);
    });

    it('calls signal with the right parameters', function () {
      var revision = 2,
        operation = '123',
        selection = 2;
      adapter.sendOperation(revision, operation, selection);
      expect(session.signal).toHaveBeenCalledWith({
        type: 'opentok-editor-operation',
        data: JSON.stringify({
          revision: revision,
          operation: operation,
          selection: selection
        })
      }, jasmine.any(Function));
    });
  });

  describe('sendSelection', function () {
    var session,
      adapter;
    beforeEach(function () {
      session = jasmine.createSpyObj('session', ['on', 'signal']);
      adapter = new OpenTokAdapter(session, 1, 'foo', []);
    });

    it('calls signal with the right parameters', function () {
      var selection = 2;
      adapter.sendSelection(selection);
      expect(session.signal).toHaveBeenCalledWith({
        type: 'opentok-editor-selection',
        data: JSON.stringify(selection)
      });
    });
  });

  describe('signal event handlers', function () {
    var session,
      adapter;
    beforeEach(function () {
      session = {connection: {connectionId: 'sessionConnectionId'}};
      OT.$.eventing(session);
      adapter = new OpenTokAdapter(session, 0, '', []);
    });

    it('triggers client_left on connectionDestroyed', function (done) {
      var mockConnectionId = 'mockConnectionId',
        mockEvent = {connection:{connectionId: mockConnectionId}};
      adapter.on('client_left', function (connectionId) {
        expect(connectionId).toEqual(mockConnectionId);
        done();
      });
      session.trigger('connectionDestroyed', mockEvent);
    });

    it('triggers operation and cursor on signal:opentok-editor-operation', function (done) {
      var mockSignalEvent = {
        data: JSON.stringify({
          revision:0,
          operation:["1234"],
          cursor: {
            position:19,
            selection:[]
          }
        }),
        from: {connectionId: 'mockConnectionId'}
      };
      adapter.on('operation', function (operation) {
        expect(operation).toEqual(["1234"]);
        done();
      });
      session.trigger('signal:opentok-editor-operation', mockSignalEvent);
    });

    it('triggers ack for your own signal:opentok-editor-operation', function (done) {
      var mockSignalEvent = {
        data: JSON.stringify({
          revision:0,
          operation:["1234"],
          cursor: {
            position:19,
            selection:[]
          }
        }),
        from: {connectionId: 'sessionConnectionId'}
      };
      adapter.on('ack', function () {
        done();
      });
      session.trigger('signal:opentok-editor-operation', mockSignalEvent);
    });

    it('triggers selection on signal:opentok-editor-selection', function (done) {
      var mockSelection = {
          position:19,
          selection:[]
        },
        mockSignalEvent = {
          data: JSON.stringify(mockSelection),
          from: {connectionId: 'mockConnectionId'}
        };
      adapter.on('selection', function (connectionId, selection) {
        expect(connectionId).toEqual('mockConnectionId');
        expect(selection).toEqual(mockSelection);
        done();
      });
      session.trigger('signal:opentok-editor-selection', mockSignalEvent);
    });
  });
});

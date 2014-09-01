describe('directive: opentok-editor', function () {
  var element, scope, session, CodeMirror, myCodeMirror,
    mockValue = '// Write code here',
    mockMode = 'javascript',
    mockModes = '[{name: \'Javascript\', value: \'javascript\'},' +
      ' {name: \'Markdown\', value: \'markdown\'}]';
  
  beforeEach(function () {
    var oldCodeMirror = window.CodeMirror;
    window.CodeMirror = spyOn(window, 'CodeMirror').and.callFake(function () {
      // Implementing my own callthrough that captures the return value
      myCodeMirror = oldCodeMirror.apply(this, arguments);
      return myCodeMirror;
    });
    module('opentok-editor', function ($provide) {
      $provide.decorator('OTSession', function ($delegate) {
        session = {isConnected: function(){}, signal: function(){}, connection: {connectionId: 'sessionConnectionId'}};
        OT.$.eventing(session);
        spyOn(session, 'on').and.callThrough();
        spyOn(session, "isConnected").and.returnValue(true);
        spyOn(session, 'signal');
        $delegate.session = session;
        return $delegate;
      });
    });
    inject(function (_OTSession_) {
      OTSession = _OTSession_;
    });
  });
  
  beforeEach(inject(function ($rootScope, $compile) {
    scope = $rootScope.$new();
    
    element = '<ot-editor modes="' + mockModes + '" value="' + mockValue + '" ' + 
      'mode="' + mockMode + '"></ot-editor>';
    
      element = $compile(element)(scope);
      scope.$digest();
  }));
  
  it('should add event listeners to session and check if its connected', function () {
    expect(session.on).toHaveBeenCalled();
    expect(session.isConnected).toHaveBeenCalled();
  });
  
  it('should setup the isolate scope correctly', function () {
    expect(element.isolateScope().connecting).toBe(true);
    expect(element.isolateScope().selectedMode).toEqual({
      name: 'Javascript',
      value: 'javascript'
    });
  });
  
  it('should create a selector with the right data', function () {
    expect(element.find('select').children().length).toBe(2);
    expect(element.find('option')[0].innerHTML).toBe('Javascript');
    expect($(element.find('option')[0]).attr('selected')).toBe('selected');
    expect(element.find('option')[1].innerHTML).toBe('Markdown');
  });
  
  it('should create a CodeMirror and signal:opentok-editor-request-doc when connected', function (done) {
    session.trigger('sessionConnected');
    
    setTimeout(function () {
      expect(window.CodeMirror).toHaveBeenCalledWith(jasmine.any(Object), jasmine.objectContaining({
        value: mockValue,
        mode: mockMode
      }));
      expect(session.signal).toHaveBeenCalledWith({
        type: 'opentok-editor-request-doc'
      });
      done();
    }, 10);
  });
  
  describe('connected and document initialised', function () {
    var adapter;
    beforeEach(function (done) {
      spyOn(window, 'OpenTokAdapter').and.callThrough();
      var signal = {
        type: 'opentok-editor-doc',
        data: JSON.stringify({
          revision: 0,
          clients: [],
          str: mockValue,
          operations: []
        })
      };
      session.trigger('signal:opentok-editor-doc', signal);
      setTimeout(function () {
        adapter = OpenTokAdapter.calls.mostRecent().object;
        done();
      }, 10);
    });
    
    it('has initialised the document', function () {
      expect(OpenTokAdapter).toHaveBeenCalledWith(session, 0, mockValue, []);
      expect(element.isolateScope().connecting).toBe(false);
      expect(element.find('.CodeMirror').length).toBe(1);
      expect(element.find('.CodeMirror-code').length).toBe(1);
      expect(myCodeMirror.getValue()).toBe(mockValue);
    });
    
    it('signals the opentok-editor-doc state when it receives a request', function (done) {
      var mockConnection = {
        connectionId: 'mockConnectionId'
      },
        mockSignalEvent = {
        type: 'signal:opentok-editor-request-doc',
        from: mockConnection
      };
      session.dispatchEvent(mockSignalEvent);
      setTimeout(function () {
        expect(session.signal).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'opentok-editor-doc',
          to: mockConnection,
          data: JSON.stringify({
            revision: 0,
            clients: [],
            str: mockValue,
            operations: []
          })
        }));
        done();
      }, 10);
    });
    
    it('handles a single operation correctly', function (done) {
      var mockSignalEvent = {
        data: JSON.stringify({
          revision:0,
          operation:[18, "1234"],
          cursor: {
            position:19,
            selection:[]
          }
        }),
        from: {connectionId: 'mockConnectionId'}
      };
      session.trigger('signal:opentok-editor-operation', mockSignalEvent);
      setTimeout(function () {
        expect(myCodeMirror.getValue()).toEqual(mockValue + '1234');
        done();
      }, 10);
    });
    
    it('handles 2 simultaneous operations correctly', function (done) {
      var mockSignalEvent1 = {
        data: JSON.stringify({
          revision:0,
          operation:[18, "1234"],
          cursor: {
            position:19,
            selection:[]
          }
        }),
        from: {connectionId: 'mockConnectionId'}
      };
      var mockSignalEvent2 = {
        data: JSON.stringify({
          revision:0,
          operation:[18, "5678"],
          cursor: {
            position:19,
            selection:[]
          }
        }),
        from: {connectionId: 'mockConnectionId2'}
      };
      session.trigger('signal:opentok-editor-operation', mockSignalEvent2);
      session.trigger('signal:opentok-editor-operation', mockSignalEvent1);
      setTimeout(function () {
        expect(myCodeMirror.getValue()).toEqual(mockValue + '1234' + '5678');
        done();
      }, 10);
    });
  });
});
define([
    'core/js/adapt'
], function(Adapt) {

    var ActivityScore = Backbone.Controller.extend({

        initialize: function(options, defaults) {

            options = options || {};
            _.extend(this, {
                _scaled: undefined,
                _raw: undefined,
                _min: undefined,
                _max: undefined
            }, defaults, options);

        }

    });
    
    var ActivityResult = Backbone.Controller.extend({

        initialize: function (options, defaults) {

            options = options || {};

            _.extend(this, {
                _score: undefined,
                _success: undefined,
                _completion: undefined,
                response: undefined,
                _duration: undefined
            }, defaults, options);

            if (options.score) {
                this.setScore(options.score);
            }

        },

        setScore: function(scaled, raw, min, max) {

            var activityScore;

            switch (typeof arguments[0]) {
                case "object":

                    // Interpret first argument as an options object
                    // Make sure the value conforms to type
                    if (!(arguments[0] instanceof ActivityScore)) {
                        activityScore = new ActivityScore(arguments[0]);
                    }
                    break;

                default:

                    // Process as if separate arguments were passed
                    activityScore = new ActivityScore({
                        _scaled: scaled,
                        _raw: raw,
                        _min: min,
                        _max: max
                    });
                    break;

            }

            this.score = activityScore;

            return this;

        }

    });

    var Activity = Backbone.Controller.extend({

        hasValidType: function() {
            return _.contains(Adapt.activity.types, this._type);
        },

        initialize: function(options, defaults) {

            options = options || {};

            _.extend(this, {
                _type: undefined,
                _id: undefined,
                name: undefined
            }, defaults, options);

        },
        
        perform: function(verb, result) {

            // Verb type check
            if (!verb || !_.contains(Adapt.activity.verbs, verb)) {
                throw "First argument should be of a valid verb";
            }

            // Convert result to instance of ActivityResult
            if (result && !(result instanceof ActivityResult)) {
                result = new ActivityResult(result);
            }

            var passThroughArguments = Array.prototype.slice.call(arguments, 2);
            
            var eventName = [
                'activity',
                 this.type.toLowerCase(),
                 verb.toLowerCase()
            ];
            
            var eventObject = {
                activity: this,
                arguments: passThroughArguments,
                name: eventName.join(":"),
                result: result,
                timestamp: Date.now(),
                verb: verb
            };

            // Allow activity logging plugins to hook and report to other systems (xAPI, SCORM, etc)

            // Trigger "activity:activityName:verb"
            var activityTypeVerbEventArgs = [ eventObject.name, eventObject ].concat(passThroughArguments);
            Adapt.activity.trigger.apply( Adapt.activity, activityTypeVerbEventArgs );

            // Trigger "activity:activityName"
            var activityTypeEventArgs = [ eventName[0] + ":" + eventName[1], eventObject ].concat(passThroughArguments);
            Adapt.activity.trigger.apply( Adapt.activity, activityTypeEventArgs );

            // Trigger "activity"
            var everyEventArgs = [ eventName[0], eventObject ].concat(passThroughArguments);
            Adapt.activity.trigger.apply( Adapt.activity, everyEventArgs );

            return this;

        }

    });


    var Controller = Backbone.Controller.extend({

        // Global expression verbs and activity types
        verbs: undefined,

        types: undefined,

        // Global expression of core classes
        Activity: Activity,

        Score: ActivityScore,

        Result: ActivityResult,
        
        initialize: function() {
            
            Adapt.once('configModel:loadCourseData', this.onLoadCourseData.bind(this));

        },
        
        onLoadCourseData: function() {

            var config = Adapt.config.get("_activity");
            if (!config || !config._isEnabled)  return;

            this._config = config;
            this.verbs = this._config._verbs;
            this.types = this._config._activityTypes;

            Adapt.log.debug('Adapt.activity interface setup');
            this.trigger('activity:ready');

        },

        // Create an activity
        create: function(options, defaultOptions) {

            return new Activity(options, defaultOptions);

        }

    });

    return Adapt.activity = new Controller();

});

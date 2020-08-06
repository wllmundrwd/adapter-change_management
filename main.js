// Import built-in Node.js package path.
const path = require('path');

/**
 * Import the ServiceNowConnector class from local Node.js module connector.js
 *   and assign it to constant ServiceNowConnector.
 * When importing local modules, IAP requires an absolute file reference.
 * Built-in module path's join method constructs the absolute filename.
 */
const ServiceNowConnector = require(path.join(__dirname, '/connector.js'));

/**
 * Import built-in Node.js package events' EventEmitter class and
 * assign it to constant EventEmitter. We will create a child class
 * from this class.
 */
const EventEmitter = require('events').EventEmitter;

/**
 * The ServiceNowAdapter class.
 *
 * @summary ServiceNow Change Request Adapter
 * @description This class contains IAP adapter properties and methods that IAP
 *   brokers and products can execute. This class inherits the EventEmitter
 *   class.
 */
class ServiceNowAdapter extends EventEmitter {

  /**
   * Here we document the ServiceNowAdapter class' callback. It must follow IAP's
   *   data-first convention.
   * @callback ServiceNowAdapter~requestCallback
   * @param {(object|string)} responseData - The entire REST API response.
   * @param {error} [errorMessage] - An error thrown by REST API call.
   */

  /**
   * Here we document the adapter properties.
   * @typedef {object} ServiceNowAdapter~adapterProperties - Adapter
   *   instance's properties object.
   * @property {string} url - ServiceNow instance URL.
   * @property {object} auth - ServiceNow instance credentials.
   * @property {string} auth.username - Login username.
   * @property {string} auth.password - Login password.
   * @property {string} serviceNowTable - The change request table name.
   */

  /**
   * @memberof ServiceNowAdapter
   * @constructs
   *
   * @description Instantiates a new instance of the Itential ServiceNow Adapter.
   * @param {string} id - Adapter instance's ID.
   * @param {ServiceNowAdapter~adapterProperties} adapterProperties - Adapter instance's properties object.
   */
  constructor(id, adapterProperties) {
    // Call super or parent class' constructor.
    super();
    // Copy arguments' values to object properties.
    this.id = id;
    this.props = adapterProperties;
    // Instantiate an object from the connector.js module and assign it to an object property.
    //log.info("url: ", this.props.url)
    //log.info("username: ", this.props.auth.username)
    //log.info("password: ", this.props.auth.password)
    //log.info("serviceNowTable: ", this.props.serviceNowTable)
    this.connector = new ServiceNowConnector({
      url: this.props.url,
      username: this.props.auth.username,
      password: this.props.auth.password,
      serviceNowTable: this.props.serviceNowTable
    });
  }

  /**
   * @memberof ServiceNowAdapter
   * @method connect
   * @summary Connect to ServiceNow
   * @description Complete a single healthcheck and emit ONLINE or OFFLINE.
   *   IAP calls this method after instantiating an object from the class.
   *   There is no need for parameters because all connection details
   *   were passed to the object's constructor and assigned to object property this.props.
   */
  connect() {
    // As a best practice, Itential recommends isolating the health check action
    // in its own method.
    this.healthcheck();
  }

  /**
 * @memberof ServiceNowAdapter
 * @method healthcheck
 * @summary Check ServiceNow Health
 * @description Verifies external system is available and healthy.
 *   Calls method emitOnline if external system is available.
 *
 * @param {ServiceNowAdapter~requestCallback} [callback] - The optional callback
 *   that handles the response.
 */
    healthcheck(callback) {
        this.getRecord((result, error) => {
        /**
            * For this lab, complete the if else conditional
            * statements that check if an error exists
            * or the instance was hibernating. You must write
            * the blocks for each branch.
            */
            if (error) {
                //log.error(error);
                log.info("ServiceNow Adapter: OFFLINE");
                this.emitOffline();
                if(callback){
                    callback(error);
                }   
            } else {
                //log.info(result);
                log.info("ServiceNow Adapter: ONLINE");
                this.emitOnline();
                if(callback){
                    callback(result);
                }
            }
        });
    }

  /**
   * @memberof ServiceNowAdapter
   * @method emitOffline
   * @summary Emit OFFLINE
   * @description Emits an OFFLINE event to IAP indicating the external
   *   system is not available.
   */
  emitOffline() {
    this.emitStatus('OFFLINE');
    log.warn('ServiceNow: Instance is unavailable.');
  }

  /**
   * @memberof ServiceNowAdapter
   * @method emitOnline
   * @summary Emit ONLINE
   * @description Emits an ONLINE event to IAP indicating external
   *   system is available.
   */
  emitOnline() {
    this.emitStatus('ONLINE');
    log.info('ServiceNow: Instance is available.');
  }

  /**
   * @memberof ServiceNowAdapter
   * @method emitStatus
   * @summary Emit an Event
   * @description Calls inherited emit method. IAP requires the event
   *   and an object identifying the adapter instance.
   *
   * @param {string} status - The event to emit.
   */
  emitStatus(status) {
    log.info("Why me?")
    this.emit(status, { id: this.id });
  }

  /**
   * @memberof ServiceNowAdapter
   * @method getRecord
   * @summary Get ServiceNow Record
   * @description Retrieves a record from ServiceNow.
   *
   * @param {ServiceNowAdapter~requestCallback} callback - The callback that
   *   handles the response.
   */
  getRecord(callback) {
    /**
     * Write the body for this function.
     * The function is a wrapper for this.connector's get() method.
     * Note how the object was instantiated in the constructor().
     * get() takes a callback function.
     */
     let recordData = {
        change_ticket_number: null,
        active: null,
        priority: null,
        description: null,
        work_start: null,
        work_end: null,
        change_ticket_key: null,
     };
     
     let bodyData = {};
     let loopData = {};
     let outRecords = [];
     this.connector.get((data, error) => {
        if (error) {
            log.error(`\nError returned from GET request:\n${JSON.stringify(error)}`);
            callback(error);
        } else {
            log.info(`\nResponse returned from GET request:\n${JSON.stringify(data)}`);
            if(data.hasOwnProperty('body') === true){
                bodyData = JSON.parse(data.body);
                if(bodyData.hasOwnProperty('result') === true){
                    bodyData.result.forEach(function (item){
                        loopData = recordData;
                        loopData.change_ticket_number = item.number;
                        loopData.active = item.active;
                        loopData.priority = item.priority;
                        loopData.description = item.description;
                        loopData.work_start = item.work_start;
                        loopData.work_end = item.work_end;
                        loopData.change_ticket_key = item.sys_id;
                        outRecords.push(loopData);
                    });
                } else {
                    outRecords.push("Missing Data Results");
                }
            } else {
                outRecords.push("Missing Data Body");
            }
            callback(outRecords);
        }
     });
  }

  /**
   * @memberof ServiceNowAdapter
   * @method postRecord
   * @summary Create ServiceNow Record
   * @description Creates a record in ServiceNow.
   *
   * @param {ServiceNowAdapter~requestCallback} callback - The callback that
   *   handles the response.
   */
  postRecord(callback) {
    /**
     * Write the body for this function.
     * The function is a wrapper for this.connector's post() method.
     * Note how the object was instantiated in the constructor().
     * post() takes a callback function.
     */
    let recordData = {
        change_ticket_number: null,
        active: null,
        priority: null,
        description: null,
        work_start: null,
        work_end: null,
        change_ticket_key: null,
     };
     
     let bodyData = {};
     let resultData = {};
     
     this.connector.post((data, error) => {
        if (error) {
            log.error(`\nError returned from POST request:\n${JSON.stringify(error)}`);
            callback(error);
        } else {
            log.info(`\nResponse returned from POST request:\n${JSON.stringify(data)}`);
            if(data.hasOwnProperty('body') === true){
                bodyData = JSON.parse(data.body);
                if(bodyData.hasOwnProperty('result') === true){
                    resultData = bodyData.result;
                    recordData.change_ticket_number = resultData.number;
                    recordData.active = resultData.active;
                    recordData.priority = resultData.priority;
                    recordData.description = resultData.description;
                    recordData.work_start = resultData.work_start;
                    recordData.work_end = resultData.work_end;
                    recordData.change_ticket_key = resultData.sys_id;
                } else {
                    outRecords.push("Missing Data Results");
                }
            } else {
                outRecords.push("Missing Data Body");
            }
            callback(recordData);
        }
     });
  }
}

module.exports = ServiceNowAdapter;
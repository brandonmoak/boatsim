/**
 * Creates an observer for a property that emits events when the value changes
 * @param {Object} target - The object containing the property to observe
 * @param {string} propertyName - The name of the property to observe
 * @param {EventEmitter} emitter - The EventEmitter instance to emit events on
 * @param {string} eventName - The name of the event to emit when the property changes
 */
export function observeProperty(target, propertyName, emitter, eventName) {
    // Store the original value
    let originalValue = target[propertyName];
    
    // Define the property with getter/setter
    Object.defineProperty(target, propertyName, {
        get: function() {
            return originalValue;
        },
        set: function(newValue) {
            const oldValue = originalValue;
            originalValue = newValue;
            
            // Emit the change event with relevant data
            emitter.emit(eventName, {
                propertyName,
                oldValue,
                newValue,
                timestamp: Date.now()
            });
        }
    });
}

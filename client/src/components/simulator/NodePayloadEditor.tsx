import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import type { NodeSettings } from '../../types';

interface NodePayloadEditorProps {
  dataType?: 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String';
  payload: NodeSettings['payload'];
  onChange: (payload: NodeSettings['payload']) => void;
  namePrefix?: string;
}

const DEFAULT_PAYLOAD: NonNullable<NodeSettings['payload']> = {
  quality: 'good',
  timestampMode: 'auto',
  value: 0,
  valueMode: 'random',
  customFields: [],
};

export default function NodePayloadEditor({
  dataType,
  payload,
  onChange,
  namePrefix = '',
}: NodePayloadEditorProps) {
  const [localPayload, setLocalPayload] = useState<
    NonNullable<NodeSettings['payload']>
  >(payload ?? DEFAULT_PAYLOAD);

  useEffect(() => {
    setLocalPayload(payload ?? DEFAULT_PAYLOAD);
  }, [payload]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localPayload, [field]: value };
    setLocalPayload(updated);
    onChange(updated);
  };

  const handleCustomFieldChange = (
    index: number,
    field: 'key' | 'value' | 'type',
    value: any
  ) => {
    const customFields = [...(localPayload.customFields || [])];
    customFields[index] = { ...customFields[index], [field]: value };
    handleChange('customFields', customFields);
  };

  const handleAddCustomField = () => {
    const customFields = [
      ...(localPayload.customFields || []),
      { key: '', value: '', type: 'string' as const },
    ];
    handleChange('customFields', customFields);
  };

  const handleRemoveCustomField = (index: number) => {
    const customFields = [...(localPayload.customFields || [])];
    customFields.splice(index, 1);
    handleChange('customFields', customFields);
  };

  // Determine allowed value modes based on dataType
  const allowedValueModes = useMemo(() => {
    if (dataType === 'String') {
      return ['static'];
    }
    if (dataType === 'Bool' || dataType === 'Boolean') {
      return ['static', 'random'];
    }
    return ['static', 'random', 'increment'];
  }, [dataType]);

  // Build live preview payload
  const previewPayload = useMemo(() => {
    const quality = localPayload.quality || 'good';
    const timestampMode = localPayload.timestampMode || 'auto';
    const timestamp =
      timestampMode === 'fixed'
        ? localPayload.fixedTimestamp || Date.now()
        : Date.now();

    let value: any = localPayload.value ?? 0;
    const valueMode = localPayload.valueMode || 'random';

    // Generate sample value based on mode and dataType
    if (valueMode === 'static') {
      value = localPayload.value ?? 0;
    } else if (valueMode === 'random') {
      if (dataType === 'Bool' || dataType === 'Boolean') {
        value = true;
      } else if (dataType === 'String') {
        value = localPayload.value || '';
      } else {
        const min = localPayload.minValue ?? (dataType === 'Int' ? 1 : 0);
        const max = localPayload.maxValue ?? (dataType === 'Int' ? 100 : 1.0);
        const raw = (min + max) / 2;
        if (dataType === 'Int') {
          value = Math.round(raw);
        } else {
          const precision = localPayload.precision ?? 2;
          value = Number(raw.toFixed(precision));
        }
      }
    } else if (valueMode === 'increment') {
      const start = typeof localPayload.value === 'number' ? localPayload.value : 0;
      value = dataType === 'Int' ? Math.round(start) : Number(start.toFixed(localPayload.precision ?? 2));
    }

    const preview: Record<string, any> = {
      quality,
      timestamp,
      value,
    };

    // Add custom fields
    if (localPayload.customFields?.length) {
      localPayload.customFields.forEach((field) => {
        if (field.key) {
          preview[field.key] = field.value;
        }
      });
    }

    return preview;
  }, [localPayload, dataType]);

  const currentValueMode = localPayload.valueMode || 'random';
  const currentTimestampMode = localPayload.timestampMode || 'auto';

  // Validation warnings
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (
      localPayload.minValue !== undefined &&
      localPayload.maxValue !== undefined &&
      localPayload.minValue > localPayload.maxValue
    ) {
      warnings.push('Min value must be less than max value');
    }

    if (
      localPayload.precision !== undefined &&
      localPayload.precision < 0
    ) {
      warnings.push('Precision must be 0 or greater');
    }

    if (
      currentValueMode === 'increment' &&
      localPayload.step !== undefined &&
      localPayload.step === 0
    ) {
      warnings.push('Step must be non-zero');
    }

    if (
      (dataType === 'Bool' || dataType === 'Boolean') &&
      currentValueMode === 'random' &&
      (localPayload.minValue !== undefined || localPayload.maxValue !== undefined)
    ) {
      warnings.push('Min/max not applicable for Boolean - will randomly toggle true/false');
    }

    if (
      dataType === 'String' &&
      (currentValueMode === 'random' || currentValueMode === 'increment')
    ) {
      warnings.push('Only static mode is supported for String nodes');
    }

    return warnings;
  }, [localPayload, dataType, currentValueMode]);

  const randomDescription =
    dataType === 'Bool' || dataType === 'Boolean'
      ? 'Randomly toggle between true and false'
      : `Generate random ${dataType || 'numeric'} values within a range`;

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Title with data type badge */}
      <div>
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
          Value Behavior
          {dataType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-mono">
              {dataType}
            </span>
          )}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Define how this {dataType || 'metric'} generates values during
          simulation
        </p>
      </div>

      {/* ── Section 1: Value Generation ── */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Value Generation
        </h5>

        {/* Generation Mode */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Generation Mode
          </label>
          <div className="space-y-2">
            {allowedValueModes.includes('static') && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${namePrefix}valueMode`}
                  value="static"
                  checked={currentValueMode === 'static'}
                  onChange={(e) => handleChange('valueMode', e.target.value)}
                  className="mt-0.5 text-blue-500 focus:ring-2 focus:ring-blue-400"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Static
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    Always publish the same value
                  </span>
                </div>
              </label>
            )}
            {allowedValueModes.includes('random') && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${namePrefix}valueMode`}
                  value="random"
                  checked={currentValueMode === 'random'}
                  onChange={(e) => handleChange('valueMode', e.target.value)}
                  className="mt-0.5 text-blue-500 focus:ring-2 focus:ring-blue-400"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Random
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    {randomDescription}
                  </span>
                </div>
              </label>
            )}
            {allowedValueModes.includes('increment') && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`${namePrefix}valueMode`}
                  value="increment"
                  checked={currentValueMode === 'increment'}
                  onChange={(e) => handleChange('valueMode', e.target.value)}
                  className="mt-0.5 text-blue-500 focus:ring-2 focus:ring-blue-400"
                />
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Increment
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    Step through values sequentially, wrapping at max
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Conditional fields based on value mode */}
        {currentValueMode === 'static' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Value
            </label>
            {dataType === 'Bool' || dataType === 'Boolean' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!localPayload.value}
                  onChange={(e) => handleChange('value', e.target.checked)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {localPayload.value ? 'True' : 'False'}
                </span>
              </label>
            ) : dataType === 'String' ? (
              <input
                type="text"
                placeholder="Enter static value"
                value={
                  typeof localPayload.value === 'string'
                    ? localPayload.value
                    : ''
                }
                onChange={(e) => handleChange('value', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <input
                type="number"
                step={dataType === 'Float' ? '0.01' : '1'}
                placeholder="Enter static value"
                value={
                  typeof localPayload.value === 'number'
                    ? localPayload.value
                    : ''
                }
                onChange={(e) => handleChange('value', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </div>
        )}

        {currentValueMode === 'random' && (
          <div className="space-y-3">
            {dataType !== 'Bool' && dataType !== 'Boolean' && dataType !== 'String' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Min Value
                    </label>
                    <input
                      type="number"
                      step={dataType === 'Float' ? '0.01' : '1'}
                      placeholder={dataType === 'Int' ? '1' : '0'}
                      value={localPayload.minValue ?? ''}
                      onChange={(e) =>
                        handleChange('minValue', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Max Value
                    </label>
                    <input
                      type="number"
                      step={dataType === 'Float' ? '0.01' : '1'}
                      placeholder={dataType === 'Int' ? '100' : '1.0'}
                      value={localPayload.maxValue ?? ''}
                      onChange={(e) =>
                        handleChange('maxValue', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                {dataType === 'Float' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Precision (decimal places)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="2"
                      value={localPayload.precision ?? ''}
                      onChange={(e) =>
                        handleChange('precision', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}
              </>
            )}
            {(dataType === 'Bool' || dataType === 'Boolean') && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Will randomly toggle between true and false
              </p>
            )}
          </div>
        )}

        {currentValueMode === 'increment' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Start Value
                </label>
                <input
                  type="number"
                  step={dataType === 'Float' ? '0.01' : '1'}
                  placeholder="0"
                  value={
                    typeof localPayload.value === 'number'
                      ? localPayload.value
                      : ''
                  }
                  onChange={(e) => handleChange('value', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Step
                </label>
                <input
                  type="number"
                  step={dataType === 'Float' ? '0.01' : '1'}
                  placeholder="1"
                  value={localPayload.step ?? ''}
                  onChange={(e) => handleChange('step', Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Max (wrap to start)
              </label>
              <input
                type="number"
                step={dataType === 'Float' ? '0.01' : '1'}
                placeholder="Optional"
                value={localPayload.maxValue ?? ''}
                onChange={(e) =>
                  handleChange('maxValue', Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {dataType === 'Float' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Precision (decimal places)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="2"
                  value={localPayload.precision ?? ''}
                  onChange={(e) =>
                    handleChange('precision', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Validation warnings */}
        {validationWarnings.length > 0 && (
          <div className="space-y-1">
            {validationWarnings.map((warning, i) => (
              <p key={i} className="text-xs text-orange-500 dark:text-orange-400">
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Message Metadata ── */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Message Metadata
        </h5>

        {/* Quality */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Quality
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={localPayload.quality || 'good'}
            onChange={(e) => handleChange('quality', e.target.value)}
          >
            <option value="good">Good</option>
            <option value="bad">Bad</option>
            <option value="uncertain">Uncertain</option>
          </select>
        </div>

        {/* Timestamp Mode */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Timestamp
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`${namePrefix}timestampMode`}
                value="auto"
                checked={currentTimestampMode === 'auto'}
                onChange={(e) => handleChange('timestampMode', e.target.value)}
                className="text-blue-500 focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto (current time)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`${namePrefix}timestampMode`}
                value="fixed"
                checked={currentTimestampMode === 'fixed'}
                onChange={(e) => handleChange('timestampMode', e.target.value)}
                className="text-blue-500 focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Fixed
              </span>
            </label>
            {currentTimestampMode === 'fixed' && (
              <input
                type="number"
                placeholder="Timestamp (ms)"
                value={localPayload.fixedTimestamp || ''}
                onChange={(e) =>
                  handleChange('fixedTimestamp', Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ml-6"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Custom Fields ── */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Custom Fields
        </h5>
        <div className="space-y-2">
          {(localPayload?.customFields ?? []).map((field, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Key"
                value={field.key}
                onChange={(e) =>
                  handleCustomFieldChange(index, 'key', e.target.value)
                }
                className="sm:col-span-4 px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                placeholder="Value"
                value={typeof field.value === 'boolean' ? String(field.value) : field.value}
                onChange={(e) =>
                  handleCustomFieldChange(
                    index,
                    'value',
                    field.type === 'number'
                      ? Number(e.target.value)
                      : field.type === 'boolean'
                        ? e.target.value === 'true'
                        : e.target.value
                  )
                }
                className="sm:col-span-4 px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex items-center gap-2 sm:col-span-4 sm:grid sm:grid-cols-4">
                <select
                  value={field.type}
                  onChange={(e) =>
                    handleCustomFieldChange(index, 'type', e.target.value)
                  }
                  className="flex-1 sm:col-span-3 px-2 py-1.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(index)}
                  className="sm:col-span-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCustomField}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Field
          </button>
        </div>
      </div>

      {/* ── Section 4: Message Preview ── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Message Preview
        </h5>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Sample MQTT message published for this node
        </p>
        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
          {JSON.stringify(previewPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

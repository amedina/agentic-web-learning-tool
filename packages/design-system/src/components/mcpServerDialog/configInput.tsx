/**
 * External dependencies.
 */
import { Link, Lock, Text } from 'lucide-react';
import type { MCPServerConfig } from '@google-awlt/common';

/**
 * Internal dependencies.
 */
import InputGroup from '../inputGroup';
import Input from '../input';
import ToggleSwitch from '../toggleSwitch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

interface MCPServerConfigInput {
  config: MCPServerConfig;
  setConfig: (key: string, value: any) => void;
}

export function ConfigInput({ config, setConfig }: MCPServerConfigInput) {
  return (
    <div className="flex-1 flex flex-col p-0 gap-4 relative bg-background overflow-auto pr-2">
      <InputGroup label="Transport Type">
        <Select
          value={config.transport || 'http'}
          onValueChange={(value) => setConfig('transport', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select transport type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sse">SSE</SelectItem>
            <SelectItem value="http">HTTP</SelectItem>
          </SelectContent>
        </Select>
      </InputGroup>

      <InputGroup label="Server Nickname">
        <div className="relative">
          <Input
            type="text"
            value={config.name}
            onChange={(e) => setConfig('name', e.target.value)}
            className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
            placeholder="My Server"
          />
          <Text className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
        </div>
      </InputGroup>

      <InputGroup label="MCP Server URL">
        <div className="relative">
          <Input
            type="text"
            value={config.url || ''}
            onChange={(e) => setConfig('url', e.target.value)}
            className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
            placeholder="http://localhost:8000/mcp"
          />
          <Link className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
        </div>
      </InputGroup>

      <InputGroup label="Authorisation Token">
        <div className="relative">
          <Input
            type="text"
            value={config.authToken || ''}
            onChange={(e) => setConfig('authToken', e.target.value)}
            className="bg-transparent border-darth-vader text-accent-foreground transition-all w-full pl-3 pr-9 py-2 rounded-md text-sm font-mono"
            placeholder="optional_token"
          />
          <Lock className="absolute right-3 top-2.5 w-4 h-4 text-exclusive-plum" />
        </div>
      </InputGroup>

      <InputGroup label="Connect" className="flex gap-2 items-center mt-3">
        <div className="relative">
          <ToggleSwitch
            checked={config.enabled}
            className="data-[state=checked]:bg-green-400"
            onCheckedChange={(value) => setConfig('enabled', value)}
          />
        </div>
      </InputGroup>
    </div>
  );
}

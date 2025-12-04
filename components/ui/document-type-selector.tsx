"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Check, ChevronDown, Search, X, Plus, Sparkles, AlertTriangle, Brain, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { DocumentTypeCreationDialog } from "./document-type-creation-dialog";
import { toast } from "sonner";

export interface DocumentTypeOption {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  groupName: string;
  groupDisplayName: string;
  icon?: string;
  isActive: boolean;
}

export interface DocumentTypeSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  showGroupLabels?: boolean;
  showDescriptions?: boolean;
  showRecentlyUsed?: boolean;
  maxRecentItems?: number;
  filterGroups?: string[];
  className?: string;

  // Enhanced dynamic features
  enableSuggestions?: boolean;
  enableAutoAssignment?: boolean;
  enableCustomTypeCreation?: boolean;
  enableGroupFirstWorkflow?: boolean;
  uploadedFileInfo?: {
    filename: string;
    content?: string;
    fileSize?: number;
    fileFormat?: string;
  };
  onSuggestionAccepted?: (suggestion: any) => void;
  onCustomTypeCreated?: (typeData: any) => void;
  autoAssignThreshold?: number;
}

interface GroupedOptions {
  [groupName: string]: {
    group: {
      name: string;
      displayName: string;
      icon?: string;
      color?: string;
    };
    types: DocumentTypeOption[];
  };
}

export function DocumentTypeSelector({
  value,
  onValueChange,
  placeholder = "Select document type...",
  disabled = false,
  allowClear = true,
  showGroupLabels = true,
  showDescriptions = true,
  showRecentlyUsed = true,
  maxRecentItems = 5,
  filterGroups,
  className,

  // Enhanced dynamic features
  enableSuggestions = false,
  enableAutoAssignment = false,
  enableCustomTypeCreation = false,
  enableGroupFirstWorkflow = false,
  uploadedFileInfo,
  onSuggestionAccepted,
  onCustomTypeCreated,
  autoAssignThreshold,
}: DocumentTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [suggestedType, setSuggestedType] = useState<any>(null);
  const [autoAssignedType, setAutoAssignedType] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mutations for dynamic features
  const getSuggestions = useMutation(api.documentAnalysis.getDocumentTypeSuggestions);
  const autoAssign = useMutation(api.documentAnalysis.autoAssignDocumentType);
  const validateDocument = useMutation(api.documentAnalysis.validateDocumentForType);

  // Fetch document types with groups
  const documentTypes = useAuthenticatedQuery(
    api.documentTypes.getDocumentTypesByGroup,
    {}
  );
  const isLoading = documentTypes === undefined;

  // Process document types into options
  const processedOptions = useMemo(() => {
    if (!documentTypes || Object.keys(documentTypes).length === 0) {
      return { groupedOptions: {}, allOptions: [], selectedOption: null };
    }

    const grouped: GroupedOptions = {};
    const all: DocumentTypeOption[] = [];
    let selected: DocumentTypeOption | null = null;

    Object.entries(documentTypes).forEach(([groupName, groupData]) => {
      // Skip filtered groups
      if (filterGroups && !filterGroups.includes(groupName)) {
        return;
      }

      const typedGroupData = groupData as {
        group?: {
          displayName?: string;
          icon?: string;
          color?: string;
        };
        types: any[];
      };

      const types = typedGroupData.types.filter((type: any) => type.isActive);

      if (types.length === 0) {
        return;
      }

      // Create grouped entry
      grouped[groupName] = {
        group: {
          name: groupName,
          displayName: typedGroupData.group?.displayName || groupName,
          icon: typedGroupData.group?.icon,
          color: typedGroupData.group?.color,
        },
        types: types.map((type: any) => ({
          _id: type._id,
          name: type.name,
          displayName: type.displayName,
          description: type.description,
          groupName: type.groupName,
          groupDisplayName: typedGroupData.group?.displayName || groupName,
          icon: type.icon,
          isActive: type.isActive,
        })),
      };

      // Add to all options
      all.push(...grouped[groupName].types);

      // Find selected option
      if (value) {
        const found = grouped[groupName].types.find((type) => type.name === value);
        if (found) {
          selected = found;
        }
      }
    });

    const result = { groupedOptions: grouped, allOptions: all, selectedOption: selected };
    return result;
  }, [documentTypes, value, filterGroups]);

  // Extract processed options with explicit typing
  const { groupedOptions, allOptions, selectedOption } = processedOptions as {
    groupedOptions: GroupedOptions;
    allOptions: DocumentTypeOption[];
    selectedOption: DocumentTypeOption | null;
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return groupedOptions;
    }

    const filtered: GroupedOptions = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedOptions).forEach(([groupName, groupData]) => {
      const matchingTypes = groupData.types.filter(
        (type) =>
          type.displayName.toLowerCase().includes(query) ||
          type.name.toLowerCase().includes(query) ||
          type.description?.toLowerCase().includes(query) ||
          groupData.group.displayName.toLowerCase().includes(query)
      );

      if (matchingTypes.length > 0) {
        filtered[groupName] = {
          ...groupData,
          types: matchingTypes,
        };
      }
    });

    return filtered;
  }, [groupedOptions, searchQuery]);

  // Get recently used types from localStorage
  const recentTypes = useMemo(() => {
    if (!showRecentlyUsed) {
      return [];
    }

    try {
      const stored = localStorage.getItem("recentDocumentTypes");
      if (!stored) {
        return [];
      }

      const recentNames = JSON.parse(stored) as string[];
      const recent = recentNames
        .map((name) => allOptions.find((type) => type.name === name))
        .filter(Boolean)
        .slice(0, maxRecentItems);

      return recent as DocumentTypeOption[];
    } catch {
      return [];
    }
  }, [allOptions, showRecentlyUsed, maxRecentItems]);

  // Dynamic content analysis and suggestions
  const analyzeDocument = useCallback(async () => {
    if (!uploadedFileInfo || !enableSuggestions) return;

    setIsAnalyzing(true);
    setValidationErrors([]);

    try {
      // Get intelligent suggestions
      const suggestions = await getSuggestions({
        filename: uploadedFileInfo.filename,
        content: uploadedFileInfo.content,
        maxSuggestions: 3,
      });

      if (suggestions.suggestions?.length > 0) {
        const topSuggestion = suggestions.suggestions[0];
        setSuggestedType(topSuggestion);

        // Auto-assign if enabled and confident enough
        if (enableAutoAssignment && topSuggestion.confidenceScore >= (autoAssignThreshold || 0.8)) {
          try {
            const autoResult = await autoAssign({
              filename: uploadedFileInfo.filename,
              content: uploadedFileInfo.content,
            });

            if (autoResult.autoAssigned && autoResult.suggestedType) {
              setAutoAssignedType(autoResult.suggestedType);
              onValueChange?.(autoResult.suggestedType.type);
              onSuggestionAccepted?.(autoResult.suggestedType);

              toast.success(`Auto-assigned: ${autoResult.suggestedType.displayName}`, {
                description: `Confidence: ${((autoResult.confidenceScore || 0) * 100).toFixed(1)}%`
              });
            }
          } catch (error) {
            console.warn("Auto-assignment failed:", error);
          }
        }
      }
    } catch (error) {
      console.error("Document analysis failed:", error);
      toast.error("Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFileInfo, enableSuggestions, enableAutoAssignment, autoAssignThreshold, getSuggestions, autoAssign, onValueChange, onSuggestionAccepted]);

  // Trigger analysis when file info changes
  React.useEffect(() => {
    if (uploadedFileInfo && (enableSuggestions || enableAutoAssignment)) {
      analyzeDocument();
    }
  }, [uploadedFileInfo, enableSuggestions, enableAutoAssignment, analyzeDocument]);

  // Validate selected type against file
  const validateSelectedType = useCallback(async () => {
    if (!value || !uploadedFileInfo) return;

    try {
      const validation = await validateDocument({
        documentType: value,
        filename: uploadedFileInfo.filename,
        fileSize: uploadedFileInfo.fileSize || 0,
        fileFormat: uploadedFileInfo.fileFormat || "",
        content: uploadedFileInfo.content,
      });

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast.error("Document validation failed", {
          description: validation.errors[0]
        });
      } else if (validation.warnings.length > 0) {
        setValidationErrors(validation.warnings);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  }, [value, uploadedFileInfo, validateDocument]);

  // Validate when type is selected
  React.useEffect(() => {
    validateSelectedType();
  }, [value, validateSelectedType]);

  // Record selection to recent types
  const handleSelect = (type: DocumentTypeOption) => {
    onValueChange?.(type.name);
    setOpen(false);
    setSearchQuery("");
    setSuggestedType(null);
    setAutoAssignedType(null);

    // Update recent types
    if (showRecentlyUsed) {
      try {
        const stored = localStorage.getItem("recentDocumentTypes");
        const recent = stored ? (JSON.parse(stored) as string[]) : [];

        // Remove if already exists and add to beginning
        const filtered = recent.filter((name) => name !== type.name);
        filtered.unshift(type.name);

        // Keep only recent items
        const updated = filtered.slice(0, maxRecentItems);
        localStorage.setItem("recentDocumentTypes", JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to save recent document types:", error);
      }
    }

    // Trigger validation if file is uploaded
    if (uploadedFileInfo) {
      setTimeout(() => validateSelectedType(), 100);
    }
  };

  // Handle suggestion acceptance
  const handleAcceptSuggestion = (suggestion: any) => {
    onValueChange?.(suggestion.type);
    setSuggestedType(null);
    onSuggestionAccepted?.(suggestion);
    setOpen(false);
    setSearchQuery("");
    toast.success(`Selected: ${suggestion.displayName}`, {
      description: `Confidence: ${(suggestion.confidenceScore * 100).toFixed(1)}%`
    });
  };

  // Handle custom type creation
  const handleCustomTypeCreated = (typeData: any) => {
    onCustomTypeCreated?.(typeData);
    setShowCreateDialog(false);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onValueChange?.(undefined);
  };

  // Group icon component
  const GroupIcon = ({ icon, color }: { icon?: string; color?: string }) => {
    if (!icon) {
      return null;
    }

    return (
      <div
        className="w-4 h-4 rounded flex items-center justify-center"
        style={{ backgroundColor: color || "#6B7280" }}
      >
        <span className="text-white text-xs">{icon[0]?.toUpperCase()}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Auto-assigned type indicator */}
      {autoAssignedType && (
        <Alert className="bg-green-50 border-green-200">
          <Brain className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Auto-assigned:</strong> {autoAssignedType.displayName}
                <span className="ml-2 text-sm">
                  (Confidence: {(autoAssignedType.confidenceScore * 100).toFixed(1)}%)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAutoAssignedType(null);
                  onValueChange?.(undefined);
                }}
              >
                Change
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Intelligent suggestion banner */}
      {suggestedType && !autoAssignedType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">AI Suggestion</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Based on the document content, we suggest: <strong>{suggestedType.displayName}</strong>
                  <span className="ml-2 text-xs">
                    ({(suggestedType.confidenceScore * 100).toFixed(1)}% confidence)
                  </span>
                </p>
                {suggestedType.reasoning?.length > 0 && (
                  <div className="text-xs text-blue-600 mb-3">
                    {suggestedType.reasoning.slice(0, 2).join(', ')}
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestedType)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Accept Suggestion
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSuggestedType(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main selector button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isAnalyzing}
            className="w-full justify-between h-10"
          >
            <div className="flex items-center space-x-2 truncate">
              {isAnalyzing && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              )}
              {(selectedOption as DocumentTypeOption) ? (
                <>
                  <GroupIcon icon={(selectedOption as DocumentTypeOption).icon} />
                  <span className="truncate">{(selectedOption as DocumentTypeOption).displayName}</span>
                  {(selectedOption as DocumentTypeOption).groupDisplayName !== (selectedOption as DocumentTypeOption).groupName && (
                    <Badge variant="secondary" className="text-xs">
                      {(selectedOption as DocumentTypeOption).groupDisplayName}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {isAnalyzing ? "Analyzing document..." : placeholder}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {selectedOption && allowClear && !disabled && (
                <X
                  className="h-4 w-4 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                    setAutoAssignedType(null);
                    setSuggestedType(null);
                  }}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search document types..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="border-0 focus:ring-0"
              />
            </div>
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No document types found.</p>
                  {enableCustomTypeCreation && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Type
                    </Button>
                  )}
                </div>
              </CommandEmpty>

              {/* AI Suggestions */}
              {suggestedType && !searchQuery && !autoAssignedType && (
                <>
                  <CommandGroup heading="🤖 AI Suggestions">
                    <CommandItem
                      onSelect={() => handleAcceptSuggestion(suggestedType)}
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      <Lightbulb className="mr-2 h-4 w-4 text-blue-600" />
                      <GroupIcon icon={suggestedType.icon} />
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-blue-900">{suggestedType.displayName}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {(suggestedType.confidenceScore * 100).toFixed(0)}% match
                          </Badge>
                        </div>
                        <div className="text-xs text-blue-700 truncate">
                          {suggestedType.groupDisplayName} • {suggestedType.reasoning?.[0] || 'AI suggested'}
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Recently used types */}
              {showRecentlyUsed && recentTypes.length > 0 && !searchQuery && (
                <>
                  <CommandGroup heading="Recently Used">
                    {recentTypes.map((type) => (
                      <CommandItem
                        key={`recent-${type._id}`}
                        value={type.name}
                        onSelect={() => handleSelect(type)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedOption?.name === type.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <GroupIcon icon={type.icon} />
                        <div className="flex-1 truncate">
                          <div className="font-medium">{type.displayName}</div>
                          {showDescriptions && type.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {type.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Grouped types */}
              {Object.entries(filteredOptions).map(([groupName, groupData]) => (
                <CommandGroup
                  key={groupName}
                  heading={showGroupLabels ? groupData.group.displayName : undefined}
                >
                  {groupData.types.map((type) => (
                    <CommandItem
                      key={type._id}
                      value={type.name}
                      onSelect={() => handleSelect(type)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedOption?.name === type.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <GroupIcon icon={type.icon} />
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{type.displayName}</span>
                          {showGroupLabels && (
                            <Badge variant="outline" className="text-xs">
                              {groupData.group.displayName}
                            </Badge>
                          )}
                        </div>
                        {showDescriptions && type.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {type.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              {/* Create new type option */}
              {enableCustomTypeCreation && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Options">
                    <CommandItem
                      onSelect={() => {
                        setShowCreateDialog(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="font-medium">Create New Document Type</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="text-sm">
              <strong>Validation warnings:</strong>
              <ul className="mt-1 space-y-1">
                {validationErrors.slice(0, 2).map((error, index) => (
                  <li key={index} className="text-xs">• {error}</li>
                ))}
                {validationErrors.length > 2 && (
                  <li className="text-xs">• And {validationErrors.length - 2} more...</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected item details */}
      {(selectedOption as DocumentTypeOption) && showDescriptions && (selectedOption as DocumentTypeOption).description && (
        <div className="text-xs text-muted-foreground">
          {(selectedOption as DocumentTypeOption).description}
        </div>
      )}

      {/* Custom type creation dialog */}
      {enableCustomTypeCreation && (
        <DocumentTypeCreationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTypeCreated={handleCustomTypeCreated}
          suggestedDisplayName={uploadedFileInfo ? `Custom ${uploadedFileInfo.filename.split('.')[0]}` : undefined}
        />
      )}
    </div>
  );
}
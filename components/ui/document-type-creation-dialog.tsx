"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type DocumentTypeItem =
	(typeof api.documentTypes.getDocumentTypes._returnType)[number];
type DocumentGroupItem =
	(typeof api.documentGroups.getDocumentGroups._returnType)[number];

export interface DocumentTypeCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeCreated?: (typeData: any) => void;
  defaultGroupName?: string;
  suggestedName?: string;
  suggestedDisplayName?: string;
  suggestedDescription?: string;
  mode?: "create" | "suggest";
  className?: string;
}

export interface ValidationRules {
  maxSize?: number;
  allowedFormats?: string[];
  requiredFields?: string[];
}

export function DocumentTypeCreationDialog({
  open,
  onOpenChange,
  onTypeCreated,
  defaultGroupName,
  suggestedName,
  suggestedDisplayName,
  suggestedDescription,
  mode = "create",
  className,
}: DocumentTypeCreationDialogProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: suggestedName || "",
    displayName: suggestedDisplayName || "",
    description: suggestedDescription || "",
    groupName: defaultGroupName || "",
    icon: "",
  });

  const [validationRules, setValidationRules] = useState<ValidationRules>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [namingSuggestions, setNamingSuggestions] = useState<string[]>([]);

  // Fetch available document groups
  const documentGroups = useAuthenticatedQuery(api.documentGroups.getDocumentGroups, {});

  // Fetch existing document types for validation
  const existingTypes = useAuthenticatedQuery(api.documentTypes.getDocumentTypes, {
    groupName: formData.groupName,
  });

  // Mutation for creating document type
  const createDocumentTypeMutation = useMutation(api.documentTypes.createDocumentType);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: suggestedName || "",
        displayName: suggestedDisplayName || "",
        description: suggestedDescription || "",
        groupName: defaultGroupName || "",
        icon: "",
      });
      setValidationRules({});
      setValidationErrors({});
      setNamingSuggestions([]);
    }
  }, [open, suggestedName, suggestedDisplayName, suggestedDescription, defaultGroupName]);

  // Generate naming suggestions based on display name
  useEffect(() => {
    if (formData.displayName && !formData.name) {
      const suggestions = generateNamingSuggestions(formData.displayName);
      setNamingSuggestions(suggestions);
    } else {
      setNamingSuggestions([]);
    }
  }, [formData.displayName, formData.name]);

  const generateNamingSuggestions = (displayName: string): string[] => {
    const normalized = displayName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');

    const suggestions = [
      normalized,
      normalized.replace(/_/g, '-'),
      normalized.split('_').join(''),
      normalized.substring(0, 20),
      normalized.replace(/\s+/g, '')
    ];

    return [...new Set(suggestions)].slice(0, 3);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Type name is required";
    } else if (formData.name.length < 2 || formData.name.length > 50) {
      errors.name = "Type name must be between 2 and 50 characters";
    } else if (!/^[a-zA-Z0-9\s_-]+$/.test(formData.name)) {
      errors.name = "Type name can only contain letters, numbers, spaces, hyphens, and underscores";
    } else {
      // Check for duplicates in the selected group
      const normalizedName = formData.name.trim().toLowerCase();
      const existingType = existingTypes?.find(
        (type: DocumentTypeItem) => type.name.toLowerCase() === normalizedName
      );
      if (existingType) {
        errors.name = `Document type "${formData.name}" already exists in group "${formData.groupName}"`;
      }
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      errors.displayName = "Display name is required";
    } else if (formData.displayName.length < 2 || formData.displayName.length > 100) {
      errors.displayName = "Display name must be between 2 and 100 characters";
    }

    // Group validation
    if (!formData.groupName.trim()) {
      errors.groupName = "Document group is required";
    }

    // Validation rules validation
    if (validationRules.maxSize && (validationRules.maxSize < 1 || validationRules.maxSize > 100 * 1024 * 1024)) {
      errors.maxSize = "Maximum file size must be between 1MB and 100MB";
    }

    if (validationRules.allowedFormats) {
      const invalidFormats = validationRules.allowedFormats.filter(
        format => !/^[a-z0-9]+$/.test(format.toLowerCase())
      );
      if (invalidFormats.length > 0) {
        errors.allowedFormats = `Invalid file formats: ${invalidFormats.join(', ')}`;
      }
    }

    if (validationRules.requiredFields) {
      const invalidFields = validationRules.requiredFields.filter(
        field => !field.trim() || field.length < 2
      );
      if (invalidFields.length > 0) {
        errors.requiredFields = "Required fields must be at least 2 characters long";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createDocumentTypeMutation({
        name: formData.name.trim(),
        displayName: formData.displayName.trim(),
        description: formData.description?.trim() || undefined,
        groupName: formData.groupName.trim(),
        icon: formData.icon?.trim() || undefined,
        validationRules: Object.keys(validationRules).length > 0 ? validationRules : undefined,
      });
      if (result?.success) {
        toast.success("Document type created successfully!");
        onTypeCreated?.(result);
        onOpenChange(false);

        // Reset form
        setFormData({
          name: "",
          displayName: "",
          description: "",
          groupName: "",
          icon: "",
        });
        setValidationRules({});
      } else {
        toast.error((result as any)?.error || "Failed to create document type");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create document type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidationRulesChange = (field: keyof ValidationRules, value: any) => {
    setValidationRules(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRequiredField = () => {
    const newField = prompt("Enter required field name:");
    if (newField && newField.trim()) {
      setValidationRules(prev => ({
        ...prev,
        requiredFields: [...(prev.requiredFields || []), newField.trim()]
      }));
    }
  };

  const removeRequiredField = (index: number) => {
    setValidationRules(prev => ({
      ...prev,
      requiredFields: prev.requiredFields?.filter((_, i) => i !== index)
    }));
  };

  const addAllowedFormat = () => {
    const newFormat = prompt("Enter file format (e.g., pdf, docx):");
    if (newFormat && newFormat.trim()) {
      const format = newFormat.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (format) {
        setValidationRules(prev => ({
          ...prev,
          allowedFormats: [...(prev.allowedFormats || []), format]
        }));
      }
    }
  };

  const removeAllowedFormat = (index: number) => {
    setValidationRules(prev => ({
      ...prev,
      allowedFormats: prev.allowedFormats?.filter((_, i) => i !== index)
    }));
  };

  const commonFileFormats = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "tiff"];
  const commonIcons = ["file", "document", "folder", "archive", "image", "text", "spreadsheet"];

  if (!open) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === "suggest" ? "Suggest New Document Type" : "Create Document Type"}
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === "suggest"
                ? "Help us improve by suggesting a new document type"
                : "Add a new document type to organize your documents better"
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {mode === "suggest" && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your suggestion will be reviewed by administrators. You'll be notified when it's approved.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Configure the basic properties of your document type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display Name */}
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Property Appraisal Report"
                  disabled={isSubmitting}
                  className={cn(validationErrors.displayName && "border-red-500")}
                />
                {validationErrors.displayName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.displayName}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Internal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., property_appraisal_report"
                  disabled={isSubmitting}
                  className={cn(validationErrors.name && "border-red-500")}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                )}

                {/* Naming suggestions */}
                {namingSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Suggested internal names:</p>
                    <div className="flex flex-wrap gap-1">
                      {namingSuggestions.map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => setFormData(prev => ({ ...prev, name: suggestion }))}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what type of documents this category contains..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Group */}
              <div>
                <Label htmlFor="groupName">Document Group *</Label>
                <Select
                  value={formData.groupName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, groupName: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={cn(validationErrors.groupName && "border-red-500")}>
                    <SelectValue placeholder="Select a document group" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentGroups?.map((group: DocumentGroupItem) => (
                      <SelectItem key={group._id} value={group.name}>
                        <div className="flex items-center space-x-2">
                          {group.icon && <span>{group.icon}</span>}
                          <span>{group.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.groupName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.groupName}</p>
                )}
              </div>

              {/* Icon */}
              <div>
                <Label htmlFor="icon">Icon (optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., 📄 or lucide:file-text"
                    disabled={isSubmitting}
                  />
                  <div className="flex space-x-1">
                    {commonIcons.map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        disabled={isSubmitting}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validation Rules (optional)</CardTitle>
              <CardDescription>
                Set validation rules for documents of this type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Maximum File Size */}
              <div>
                <Label htmlFor="maxSize">Maximum File Size (MB)</Label>
                <Input
                  id="maxSize"
                  type="number"
                  value={validationRules.maxSize ? validationRules.maxSize / 1024 / 1024 : ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined;
                    handleValidationRulesChange("maxSize", value);
                  }}
                  placeholder="e.g., 10"
                  disabled={isSubmitting}
                  min="1"
                  max="100"
                />
                {validationErrors.maxSize && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.maxSize}</p>
                )}
              </div>

              {/* Allowed File Formats */}
              <div>
                <Label>Allowed File Formats</Label>
                <div className="space-y-2">
                  {validationRules.allowedFormats?.map((format, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="secondary">{format}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllowedFormat(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAllowedFormat}
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Format
                    </Button>
                    <div className="flex flex-wrap gap-1">
                      {commonFileFormats.map((format) => (
                        <Badge
                          key={format}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (!validationRules.allowedFormats?.includes(format)) {
                              handleValidationRulesChange("allowedFormats", [
                                ...(validationRules.allowedFormats || []),
                                format
                              ]);
                            }
                          }}
                        >
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {validationErrors.allowedFormats && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.allowedFormats}</p>
                )}
              </div>

              {/* Required Fields */}
              <div>
                <Label>Required Content Fields</Label>
                <div className="space-y-2">
                  {validationRules.requiredFields?.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="secondary">{field}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequiredField(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRequiredField}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Required Field
                  </Button>
                </div>
                {validationErrors.requiredFields && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.requiredFields}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </div>
              ) : (
                mode === "suggest" ? "Suggest Type" : "Create Type"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
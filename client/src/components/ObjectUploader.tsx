import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
      meta: {},
      locale: {
        strings: {
          // Remover completamente textos de drop
          dropPasteFiles: ' ',
          dropPasteFolders: ' ',
          dropPasteBoth: ' ', 
          dropHereOr: ' ',
          dropHint: ' ',
          browse: 'Selecionar arquivos',
          // Remover textos da área de drop
          addingMoreFiles: ' ',
          addMore: 'Adicionar mais',
          // Configurar outros textos
          uploadXFiles: {
            0: 'Carregar %{smart_count} arquivo',
            1: 'Carregar %{smart_count} arquivos'
          },
          uploadXNewFiles: {
            0: 'Carregar +%{smart_count} arquivo', 
            1: 'Carregar +%{smart_count} arquivos'
          },
          removeFile: 'Remover arquivo',
          editFile: 'Editar arquivo',
          done: 'Concluído',
          cancel: 'Cancelar',
          uploadComplete: 'Upload concluído',
          uploadPaused: 'Upload pausado',
          resumeUpload: 'Retomar upload',
          pauseUpload: 'Pausar upload',
          retryUpload: 'Tentar novamente',
        }
      }
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => {
          console.log('[OBJECT_UPLOADER] Botão clicado, abrindo modal...');
          setShowModal(true);
        }} 
        className={buttonClassName}
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note=""
        showRemoveButtonAfterComplete={true}
        showProgressDetails={false}
        hideUploadButton={false}
        hideRetryButton={false}
        hidePauseResumeButton={false}
        hideCancelButton={false}
        hideProgressAfterFinish={false}
        disableStatusBar={false}
        disableInformer={false}
        disableThumbnailGenerator={false}
        theme="light"
        width={500}
        height={400}
      />
      
      {/* CSS global para esconder textos de drop */}
      {showModal && (
        <style>{`
          .uppy-Dashboard-dropFilesHereHint,
          .uppy-Dashboard-AddFiles-title,
          .uppy-Dashboard-note,
          .uppy-Dashboard-AddFiles-info {
            display: none !important;
          }
          .uppy-size--md .uppy-Dashboard-AddFiles {
            padding-top: 20px !important;
          }
          .uppy-Dashboard-browse {
            margin-top: 0 !important;
            background: #007bff !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
          }
        `}</style>
      )}
    </div>
  );
}
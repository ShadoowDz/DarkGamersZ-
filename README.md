# FBX to CS 1.6 MDL Converter

A comprehensive web-based converter that transforms FBX files to Counter-Strike 1.6 compatible MDL format. This tool handles the complex conversion process from modern 3D model formats to the highly constrained GoldSrc MDL format used by Counter-Strike 1.6.

## Features

### Core Functionality
- **FBX File Support**: Upload and process FBX files from major 3D software
- **CS 1.6 MDL Output**: Generates valid MDL files compatible with Counter-Strike 1.6
- **Real-time Processing**: Web-based interface with live conversion progress
- **Automatic Optimization**: Handles format constraints automatically

### Conversion Capabilities
- **Mesh Processing**: Vertices, triangles, and geometry conversion
- **Animation Support**: Keyframe animations and bone hierarchies
- **Texture Conversion**: Automatic conversion to 8-bit indexed BMP format
- **Material Handling**: Basic material properties and texture mapping
- **Constraint Enforcement**: Automatic compliance with CS 1.6 limitations

### CS 1.6 Format Compliance
- Maximum 2048 vertices per model
- Maximum 4080 triangles
- Maximum 128 bones
- Maximum 32 animation sequences
- Maximum 512 keyframes per sequence
- 8-bit indexed BMP textures (max 512x512)
- Hard vertex weighting (no soft skinning)

## Installation

### Prerequisites
- Python 3.10 or higher
- Docker (optional, for containerized deployment)
- Modern web browser

### Local Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd fbx-to-mdl-converter
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**
   ```bash
   python app.py
   ```

4. **Access the Web Interface**
   Open your browser and navigate to `http://localhost:8000`

### Docker Deployment

1. **Build and Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the Application**
   Navigate to `http://localhost:8000`

### Manual Docker Build

1. **Build the Image**
   ```bash
   docker build -t fbx-mdl-converter .
   ```

2. **Run the Container**
   ```bash
   docker run -p 8000:8000 fbx-mdl-converter
   ```

## Usage

### Web Interface

1. **Upload FBX File**
   - Drag and drop your FBX file onto the upload area
   - Or click "browse files" to select from your computer
   - File size limit: 100MB

2. **Configure Conversion Settings**
   - **Optimize Vertices**: Automatically reduce vertex count to CS 1.6 limits
   - **Convert Textures**: Transform textures to indexed BMP format
   - **Simplify Bones**: Reduce bone hierarchy to maximum 128 bones
   - **Convert Animations**: Process animations for CS 1.6 compatibility

3. **Start Conversion**
   - Click "Convert to MDL" button
   - Monitor real-time progress
   - View conversion statistics and warnings

4. **Download Result**
   - Download the converted MDL file
   - Review conversion warnings and statistics
   - Use the MDL file in Counter-Strike 1.6

### API Endpoints

The application also provides REST API endpoints for programmatic access:

- `POST /convert` - Upload and convert FBX file
- `GET /status/{session_id}` - Check conversion status
- `GET /download/{session_id}` - Download converted MDL file

## File Structure

```
fbx-to-mdl-converter/
├── app.py                    # Main FastAPI application
├── fbx_to_mdl_converter.py   # Core conversion engine
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose setup
├── README.md               # This file
├── static/
│   ├── style.css           # Web interface styles
│   └── script.js           # Client-side JavaScript
└── templates/
    └── index.html          # Main web interface
```

## Technical Details

### Conversion Process

1. **FBX Parsing**
   - Uses Autodesk FBX SDK (when available)
   - Fallback parser for basic geometry
   - Extracts meshes, materials, animations, and skeleton

2. **Format Optimization**
   - Vertex decimation for poly count limits
   - Triangle reduction algorithms
   - Bone hierarchy simplification
   - Animation keyframe optimization

3. **MDL Generation**
   - GoldSrc MDL format implementation
   - Binary file structure creation
   - Texture and material encoding
   - Animation sequence processing

### CS 1.6 Constraints

The converter automatically handles these Counter-Strike 1.6 limitations:

| Component | Limit | Handling |
|-----------|-------|----------|
| Vertices | 2048 max | Automatic decimation |
| Triangles | 4080 max | Triangle reduction |
| Bones | 128 max | Skeleton simplification |
| Animations | 32 sequences max | Sequence limiting |
| Keyframes | 512 per sequence | Frame optimization |
| Textures | 512x512 8-bit BMP | Format conversion |

### Supported FBX Features

- ✅ Static meshes
- ✅ Animated meshes
- ✅ Bone hierarchies
- ✅ Keyframe animations
- ✅ Basic materials
- ✅ Texture mapping
- ❌ Advanced materials (PBR, etc.)
- ❌ Soft skinning (converted to hard)
- ❌ Complex lighting setups

## Troubleshooting

### Common Issues

1. **"FBX SDK not available" Warning**
   - The converter uses a fallback parser
   - Limited functionality but still produces basic MDL files
   - Install Autodesk FBX SDK for full features

2. **Large File Conversion Failures**
   - Reduce model complexity in your 3D software
   - Optimize textures before conversion
   - Use lower polygon count models

3. **Animation Issues**
   - Ensure animations use supported bone counts
   - Simplify complex bone hierarchies
   - Reduce keyframe counts if needed

### Development

For development and debugging:

```bash
# Run in development mode
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# View logs
docker-compose logs -f fbx-converter
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Autodesk FBX SDK for FBX file parsing
- GoldSrc MDL format specifications
- Counter-Strike modding community
- FastAPI and modern web technologies

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check existing documentation
- Review conversion warnings and errors
- Test with simpler models first

---

**Note**: This converter handles the significant differences between modern FBX format capabilities and the limited CS 1.6 MDL format. Some features may be simplified or converted during the process. Always review conversion warnings and test the output in Counter-Strike 1.6.